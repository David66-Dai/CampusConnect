"""认证相关路由：注册 / 登录 / 密码重置。"""

from typing import Any

from fastapi import APIRouter, HTTPException, status

from app.core.config import settings
from app.core.deps import DbSession
from app.schemas.user import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenData,
    UserLogin,
    UserRegister,
)
from app.services import auth_service, email_service
from app.utils.response import success_response

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=201)
def register(payload: UserRegister, db: DbSession) -> dict[str, Any]:
    """注册新账号，成功后直接返回 access_token。"""
    data: TokenData = auth_service.register_user(db, payload)
    return success_response(data=data.model_dump(), message="注册成功")


@router.post("/login")
def login(payload: UserLogin, db: DbSession) -> dict[str, Any]:
    """邮箱密码登录，返回 access_token。"""
    data: TokenData = auth_service.login_user(db, payload)
    return success_response(data=data.model_dump(), message="登录成功")


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: DbSession) -> dict[str, Any]:
    """申请密码重置。

    无论邮箱是否存在都返回相同提示（防枚举）。
    已配置 SMTP 时发送重置邮件；仅开发环境且未配置 SMTP 时回传链接。
    """
    smtp_ok = email_service.is_smtp_configured()
    if not smtp_ok and not settings.is_development:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="邮件服务未正确配置：请检查 backend/.env 的 SMTP_*（勿留占位符）并重启后端",
        )

    token = auth_service.request_password_reset(db, payload.email)
    data = None
    if token is not None:
        reset_url = f"{settings.frontend_url.rstrip('/')}/reset-password?token={token}"
        if smtp_ok:
            email_service.send_password_reset(payload.email.lower(), reset_url)
        else:
            data = {"reset_token": token, "reset_url": reset_url}

    return success_response(
        data=data,
        message="如果该邮箱已注册，重置链接已发送（30 分钟内有效）",
    )


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: DbSession) -> dict[str, Any]:
    """使用重置 Token 设置新密码。"""
    auth_service.reset_password(db, payload.token, payload.new_password)
    return success_response(message="密码已重置，请使用新密码登录")
