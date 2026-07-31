"""密码哈希与 JWT 签发/校验。"""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# bcrypt 后端；truncate_error 关闭以兼容长密码（passlib 内部会截断）
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """对明文密码做 bcrypt 哈希。"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """校验明文密码与哈希是否匹配。"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str | int,
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[dict[str, Any]] = None,
) -> str:
    """签发 JWT Access Token，subject 一般为为用户 ID。"""
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload: dict[str, Any] = {"sub": str(subject), "exp": expire}
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    """解码并校验 JWT，失败时抛出 JWTError。"""
    return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])


def get_user_id_from_token(token: str) -> Optional[int]:
    """从登录 Token 中提取用户 ID；无效或非登录用途则返回 None。"""
    try:
        payload = decode_access_token(token)
        # 密码重置等特殊用途 Token 不能当登录凭证使用
        if payload.get("purpose") is not None:
            return None
        sub = payload.get("sub")
        if sub is None:
            return None
        return int(sub)
    except (JWTError, ValueError, TypeError):
        return None


def _password_fingerprint(password_hash: str) -> str:
    """密码哈希指纹：改密后旧的重置 Token 自动失效。"""
    import hashlib

    return hashlib.sha256(password_hash.encode()).hexdigest()[:16]


PASSWORD_RESET_EXPIRE_MINUTES = 30


def create_password_reset_token(user_id: int, password_hash: str) -> str:
    """签发密码重置 Token（30 分钟有效，一次性）。"""
    return create_access_token(
        subject=user_id,
        expires_delta=timedelta(minutes=PASSWORD_RESET_EXPIRE_MINUTES),
        extra_claims={
            "purpose": "password_reset",
            "fp": _password_fingerprint(password_hash),
        },
    )


def verify_password_reset_token(token: str, password_hash: str) -> Optional[int]:
    """校验重置 Token：用途、有效期、密码指纹均须匹配，返回用户 ID。"""
    try:
        payload = decode_access_token(token)
        if payload.get("purpose") != "password_reset":
            return None
        if payload.get("fp") != _password_fingerprint(password_hash):
            return None
        return int(payload["sub"])
    except (JWTError, ValueError, TypeError, KeyError):
        return None
