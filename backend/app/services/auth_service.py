"""用户认证与资料相关业务逻辑。"""

from datetime import timedelta
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_password_reset_token,
    hash_password,
    verify_password,
    verify_password_reset_token,
)
from app.models.user import User
from app.schemas.user import TokenData, UserLogin, UserPublic, UserRegister, UserUpdate


def _to_public(user: User) -> UserPublic:
    return UserPublic.model_validate(user)


def _build_token_data(user: User, remember_me: bool = False) -> TokenData:
    expire = (
        timedelta(days=30)
        if remember_me
        else timedelta(days=1)
    )
    token = create_access_token(subject=user.id, expires_delta=expire)
    return TokenData(access_token=token, user=_to_public(user))


def register_user(db: Session, payload: UserRegister) -> TokenData:
    """注册新用户并返回 JWT。邮箱已存在则 409。"""
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="该邮箱已被注册",
        )

    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        name=payload.name.strip(),
        school=payload.school.strip(),
        grade=payload.grade.strip(),
        interests=[i.strip() for i in payload.interests if i.strip()],
        skills=[],
        goals=[],
        xp=0,
        level=1,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _build_token_data(user, remember_me=True)


def login_user(db: Session, payload: UserLogin) -> TokenData:
    """邮箱密码登录，失败统一返回 401（避免枚举邮箱）。"""
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
        )
    return _build_token_data(user, remember_me=payload.remember_me)


def request_password_reset(db: Session, email: str) -> Optional[str]:
    """生成密码重置 Token。

    邮箱不存在时返回 None，但对外提示保持一致，避免枚举邮箱。
    生产环境应将 Token 通过邮件发送；开发环境直接返回给前端便于演示。
    """
    user = db.scalar(select(User).where(User.email == email.lower()))
    if user is None:
        return None
    return create_password_reset_token(user.id, user.password_hash)


def reset_password(db: Session, token: str, new_password: str) -> None:
    """校验重置 Token 并更新密码；改密后旧 Token 自动失效。"""
    invalid = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="重置链接无效或已过期，请重新申请",
    )

    # 先解出用户 ID（不校验指纹），再用该用户当前密码哈希做完整校验
    from jose import JWTError

    from app.core.security import decode_access_token

    try:
        user_id = int(decode_access_token(token)["sub"])
    except (JWTError, ValueError, TypeError, KeyError):
        raise invalid
    user = db.get(User, user_id)
    if user is None:
        raise invalid
    if verify_password_reset_token(token, user.password_hash) != user.id:
        raise invalid

    user.password_hash = hash_password(new_password)
    db.add(user)
    db.commit()


def update_user_profile(db: Session, user: User, payload: UserUpdate) -> UserPublic:
    """更新当前用户资料，仅覆盖传入的非空字段。"""
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        if field in {"interests", "skills", "goals"} and value is not None:
            value = [item.strip() for item in value if item and item.strip()]
        if isinstance(value, str):
            value = value.strip()
        setattr(user, field, value)

    db.add(user)
    db.commit()
    db.refresh(user)
    return _to_public(user)
