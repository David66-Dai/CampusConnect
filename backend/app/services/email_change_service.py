"""更改邮箱：发送验证码 → 校验后更新。"""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models.email_change import EmailChangeCode
from app.models.user import User
from app.schemas.user import UserPublic
from app.services import email_service

CODE_EXPIRE_MINUTES = 10
RESEND_COOLDOWN_SECONDS = 60
MAX_CONFIRM_ATTEMPTS = 5


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def _generate_code() -> str:
    """生成 6 位数字验证码。"""
    return f"{secrets.randbelow(1_000_000):06d}"


def request_email_change(
    db: Session, user: User, new_email: str, password: str
) -> Optional[str]:
    """校验密码后向新邮箱发验证码。

    已配置 SMTP 时发送邮件并返回 None；
    开发环境且未配置 SMTP 时返回明文验证码便于本地演示。
    """
    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="当前密码不正确"
        )

    email = new_email.lower().strip()
    if email == user.email.lower():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="新邮箱与当前邮箱相同",
        )

    taken = db.scalar(select(User).where(User.email == email))
    if taken is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="该邮箱已被其他账号使用"
        )

    latest = db.scalar(
        select(EmailChangeCode)
        .where(EmailChangeCode.user_id == user.id, EmailChangeCode.used.is_(False))
        .order_by(EmailChangeCode.created_at.desc())
        .limit(1)
    )
    if latest is not None:
        created = latest.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        elapsed = (datetime.now(timezone.utc) - created).total_seconds()
        if elapsed < RESEND_COOLDOWN_SECONDS:
            wait = int(RESEND_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"发送过于频繁，请 {wait} 秒后再试",
            )

    db.execute(
        update(EmailChangeCode)
        .where(EmailChangeCode.user_id == user.id, EmailChangeCode.used.is_(False))
        .values(used=True)
    )

    code = _generate_code()
    record = EmailChangeCode(
        user_id=user.id,
        new_email=email,
        code_hash=_hash_code(code),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRE_MINUTES),
        attempts=0,
    )
    db.add(record)
    db.commit()

    if email_service.is_smtp_configured():
        email_service.send_email_change_code(email, code)
        return None

    from app.core.config import settings

    if settings.is_development:
        return code

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="邮件服务未配置：请在 backend/.env 填写 SMTP_* 后重启后端",
    )


def confirm_email_change(db: Session, user: User, code: str) -> UserPublic:
    """校验验证码并更新邮箱。"""
    code = code.strip()
    now = datetime.now(timezone.utc)

    record = db.scalar(
        select(EmailChangeCode)
        .where(
            EmailChangeCode.user_id == user.id,
            EmailChangeCode.used.is_(False),
            EmailChangeCode.expires_at > now,
        )
        .order_by(EmailChangeCode.created_at.desc())
        .limit(1)
    )
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码无效或已过期",
        )

    if record.attempts >= MAX_CONFIRM_ATTEMPTS:
        record.used = True
        db.add(record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码尝试次数过多，请重新发送",
        )

    if not hmac.compare_digest(record.code_hash, _hash_code(code)):
        record.attempts += 1
        if record.attempts >= MAX_CONFIRM_ATTEMPTS:
            record.used = True
        db.add(record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码无效或已过期",
        )

    taken = db.scalar(
        select(User).where(User.email == record.new_email, User.id != user.id)
    )
    if taken is not None:
        record.used = True
        db.add(record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="该邮箱已被其他账号使用"
        )

    user.email = record.new_email
    record.used = True
    db.add(user)
    db.add(record)
    db.commit()
    db.refresh(user)
    return UserPublic.model_validate(user)
