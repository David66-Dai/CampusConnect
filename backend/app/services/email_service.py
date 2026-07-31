"""邮件发送（SMTP）。未配置时开发环境可回退到 API 回传验证码/链接。"""

from __future__ import annotations

import logging
import smtplib
import ssl
from email.message import EmailMessage

from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)


def is_smtp_configured() -> bool:
    host = settings.smtp_host.strip()
    user = settings.smtp_username.strip()
    password = settings.smtp_password.strip()
    if not (host and user and password):
        return False
    # 拒绝未替换的中文/示例占位符
    placeholders = ("你的邮箱", "你的授权码", "授权码", "example.com", "your@", "change-me")
    blob = f"{user} {password} {settings.smtp_from}"
    if any(p in blob for p in placeholders):
        return False
    return True



def send_email(*, to: str, subject: str, text: str, html: str | None = None) -> None:
    """通过 SMTP 发送邮件；失败抛出 502。"""
    if not is_smtp_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="邮件服务未配置：请在 backend/.env 填写 SMTP_* 后重启后端",
        )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from or settings.smtp_username
    msg["To"] = to
    msg.set_content(text)
    if html:
        msg.add_alternative(html, subtype="html")

    try:
        if settings.smtp_use_ssl:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(
                settings.smtp_host, settings.smtp_port, context=context, timeout=20
            ) as server:
                server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(
                settings.smtp_host, settings.smtp_port, timeout=20
            ) as server:
                if settings.smtp_use_tls:
                    server.starttls(context=ssl.create_default_context())
                server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(msg)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("SMTP send failed")
        detail = (
            f"邮件发送失败：{exc}"
            if settings.is_development
            else "邮件发送失败，请稍后重试"
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail,
        ) from exc


def send_password_reset(to: str, reset_url: str) -> None:
    subject = "CampusConnect — Reset your password"
    text = (
        "You requested a password reset for CampusConnect.\n\n"
        f"Open this link within 30 minutes:\n{reset_url}\n\n"
        "If you did not request this, you can ignore this email."
    )
    html = (
        "<p>You requested a password reset for <strong>CampusConnect</strong>.</p>"
        f'<p><a href="{reset_url}">Reset password</a> (valid for 30 minutes).</p>'
        "<p>If you did not request this, ignore this email.</p>"
    )
    send_email(to=to, subject=subject, text=text, html=html)


def send_email_change_code(to: str, code: str) -> None:
    subject = "CampusConnect — Confirm your new email"
    text = (
        "Your CampusConnect email change verification code is:\n\n"
        f"  {code}\n\n"
        "It expires in 10 minutes. If you did not request this, ignore this email."
    )
    html = (
        "<p>Your CampusConnect email change verification code is:</p>"
        f'<p style="font-size:24px;letter-spacing:4px;"><strong>{code}</strong></p>'
        "<p>Valid for 10 minutes. If you did not request this, ignore this email.</p>"
    )
    send_email(to=to, subject=subject, text=text, html=html)
