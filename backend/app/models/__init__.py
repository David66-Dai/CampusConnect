"""导出所有 ORM 模型，供 Alembic autogenerate 发现。"""

from app.models.email_change import EmailChangeCode
from app.models.event import Event, EventMember
from app.models.match import Match
from app.models.message import Message
from app.models.post import Comment, Post, PostLike
from app.models.product import Product
from app.models.user import User

__all__ = [
    "User",
    "Event",
    "EventMember",
    "Match",
    "Product",
    "Post",
    "Comment",
    "PostLike",
    "Message",
    "EmailChangeCode",
]
