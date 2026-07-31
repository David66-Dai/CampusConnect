"""站内私信相关 Pydantic Schema。"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class PeerInfo(BaseModel):
    """会话对方的用户摘要。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    avatar_url: Optional[str] = None
    school: str
    grade: str


class MessageCreate(BaseModel):
    """发送私信请求体。"""

    content: str = Field(..., min_length=1, max_length=2000)


class MessagePublic(BaseModel):
    """单条私信。"""

    id: int
    sender_id: int
    receiver_id: int
    content: str
    read: bool
    created_at: datetime
    is_mine: bool


class ConversationSummary(BaseModel):
    """会话列表项：对方信息 + 最后一条消息 + 未读数。"""

    peer: PeerInfo
    last_message: MessagePublic
    unread_count: int
