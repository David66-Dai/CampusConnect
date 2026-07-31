"""社区帖子相关 Pydantic Schema。"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class AuthorInfo(BaseModel):
    """帖子/评论作者摘要。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    avatar_url: Optional[str] = None
    school: str
    grade: str


class PostCreate(BaseModel):
    """发帖请求体。"""

    content: str = Field(..., min_length=1, max_length=5000)
    image_url: Optional[str] = Field(None, max_length=512)


class PostPublic(BaseModel):
    """帖子信息流返回结构。"""

    id: int
    author_id: int
    content: str
    image_url: Optional[str] = None
    created_at: datetime

    author: AuthorInfo
    like_count: int
    comment_count: int
    is_liked: bool
    is_author: bool


class LikeResult(BaseModel):
    """点赞切换结果。"""

    post_id: int
    liked: bool
    like_count: int


class CommentCreate(BaseModel):
    """评论请求体。"""

    content: str = Field(..., min_length=1, max_length=2000)


class CommentPublic(BaseModel):
    """评论返回结构。"""

    id: int
    post_id: int
    content: str
    created_at: datetime
    author: AuthorInfo
    is_author: bool
