"""用户相关路由：当前用户资料。"""

from typing import Any

from fastapi import APIRouter, Query

from app.core.config import settings
from app.core.deps import CurrentUser, DbSession
from app.schemas.user import (
    ChangeEmailRequest,
    ConfirmEmailChangeRequest,
    UserPublic,
    UserUpdate,
)
from app.services import auth_service, email_change_service, user_service
from app.utils.response import success_response

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
def get_me(current_user: CurrentUser) -> dict[str, Any]:
    """获取当前登录用户资料。"""
    data = UserPublic.model_validate(current_user)
    return success_response(data=data.model_dump(), message="ok")


@router.get("/recommended")
def get_recommended(
    current_user: CurrentUser,
    db: DbSession,
    limit: int = Query(default=6, ge=1, le=20),
) -> dict[str, Any]:
    """推荐伙伴列表（按共同兴趣排序）。"""
    partners = user_service.get_recommended_partners(db, current_user, limit)
    return success_response(
        data=[p.model_dump() for p in partners],
        message="ok",
    )


@router.put("/me")
def update_me(
    payload: UserUpdate,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """修改当前登录用户资料。"""
    data = auth_service.update_user_profile(db, current_user, payload)
    return success_response(data=data.model_dump(), message="资料已更新")


@router.post("/me/email/request")
def request_email_change(
    payload: ChangeEmailRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """申请更改邮箱：校验当前密码后向新邮箱发送验证码（10 分钟有效）。"""
    code = email_change_service.request_email_change(
        db, current_user, payload.new_email, payload.password
    )
    data = None
    if code is not None and settings.is_development:
        # 开发环境无 SMTP：直接返回验证码便于演示
        data = {
            "dev_code": code,
            "new_email": payload.new_email.lower().strip(),
            "expires_in_minutes": email_change_service.CODE_EXPIRE_MINUTES,
        }
    return success_response(
        data=data,
        message="验证码已发送到新邮箱（10 分钟内有效）",
    )


@router.post("/me/email/confirm")
def confirm_email_change(
    payload: ConfirmEmailChangeRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """提交验证码，确认更改登录邮箱。"""
    user = email_change_service.confirm_email_change(db, current_user, payload.code)
    return success_response(data=user.model_dump(), message="邮箱已更新")


@router.get("/{user_id}")
def get_user_profile(
    user_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """浏览他人主页：公开资料 + 近期活动 / 商品 / 帖子（不含邮箱）。"""
    profile = user_service.get_user_profile(db, current_user, user_id)
    return success_response(data=profile.model_dump(), message="ok")
