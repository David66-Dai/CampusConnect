"""用户相关 Pydantic Schema。"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegister(BaseModel):
    """注册请求体。"""

    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    school: str = Field(..., min_length=1, max_length=200)
    grade: str = Field(..., min_length=1, max_length=50)
    interests: list[str] = Field(default_factory=list)


class UserLogin(BaseModel):
    """登录请求体。"""

    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)
    remember_me: bool = False


class ForgotPasswordRequest(BaseModel):
    """忘记密码请求体。"""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """重置密码请求体。"""

    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=6, max_length=128)


class ChangeEmailRequest(BaseModel):
    """申请更改邮箱：需当前密码 + 新邮箱。"""

    new_email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class ConfirmEmailChangeRequest(BaseModel):
    """确认更改邮箱：验证码。"""

    code: str = Field(..., min_length=4, max_length=8)


class UserUpdate(BaseModel):
    """修改当前用户资料（所有字段可选）。"""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    school: Optional[str] = Field(None, min_length=1, max_length=200)
    grade: Optional[str] = Field(None, min_length=1, max_length=50)
    bio: Optional[str] = Field(None, max_length=2000)
    avatar_url: Optional[str] = Field(None, max_length=512)
    interests: Optional[list[str]] = None
    skills: Optional[list[str]] = None
    goals: Optional[list[str]] = None


class UserPublic(BaseModel):
    """对外暴露的用户信息（不含密码）。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    avatar_url: Optional[str] = None
    school: str
    grade: str
    bio: Optional[str] = None
    interests: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    goals: list[str] = Field(default_factory=list)
    xp: int
    level: int
    created_at: datetime


class RecommendedUser(BaseModel):
    """推荐伙伴摘要（不含邮箱）。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    avatar_url: Optional[str] = None
    school: str
    grade: str
    bio: Optional[str] = None
    interests: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    goals: list[str] = Field(default_factory=list)
    xp: int
    level: int
    common_interests: list[str] = Field(default_factory=list)


class TokenData(BaseModel):
    """登录/注册成功后返回的 Token 与用户信息。"""

    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class UserProfilePublic(BaseModel):
    """他人主页：公开资料 + 近期活动/商品/帖子（不含邮箱）。"""

    id: int
    name: str
    avatar_url: Optional[str] = None
    school: str
    grade: str
    bio: Optional[str] = None
    interests: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    goals: list[str] = Field(default_factory=list)
    xp: int
    level: int
    created_at: datetime
    is_self: bool

    events: list[dict] = Field(default_factory=list)
    products: list[dict] = Field(default_factory=list)
    posts: list[dict] = Field(default_factory=list)