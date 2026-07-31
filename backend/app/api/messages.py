"""站内私信路由。

注意：固定路径（/conversations、/unread-count）必须在 /{peer_id} 之前声明。
"""

from typing import Any

from fastapi import APIRouter, Query

from app.core.deps import CurrentUser, DbSession
from app.schemas.message import MessageCreate
from app.services import message_service
from app.utils.response import success_response

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("/conversations")
def list_conversations(current_user: CurrentUser, db: DbSession) -> dict[str, Any]:
    """会话列表（含未读数与最后一条消息）。"""
    conversations = message_service.list_conversations(db, current_user)
    return success_response(
        data=[c.model_dump() for c in conversations], message="ok"
    )


@router.get("/unread-count")
def get_unread_count(current_user: CurrentUser, db: DbSession) -> dict[str, Any]:
    """未读私信总数。"""
    count = message_service.unread_count(db, current_user)
    return success_response(data={"count": count}, message="ok")


@router.get("/{peer_id}")
def get_conversation(
    peer_id: int,
    current_user: CurrentUser,
    db: DbSession,
    limit: int = Query(default=200, ge=1, le=500),
) -> dict[str, Any]:
    """与某用户的聊天记录（自动将对方消息标记已读）。"""
    messages = message_service.get_conversation(db, current_user, peer_id, limit)
    return success_response(data=[m.model_dump() for m in messages], message="ok")


@router.post("/{peer_id}", status_code=201)
def send_message(
    peer_id: int,
    payload: MessageCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """发送私信。"""
    message = message_service.send_message(db, current_user, peer_id, payload)
    return success_response(data=message.model_dump(), message="已发送")
