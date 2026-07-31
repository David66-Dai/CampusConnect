"""站内私信业务逻辑。"""

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session

from app.models.message import Message
from app.models.user import User
from app.schemas.message import (
    ConversationSummary,
    MessageCreate,
    MessagePublic,
    PeerInfo,
)


def _to_public(message: Message, current_user: User) -> MessagePublic:
    return MessagePublic(
        id=message.id,
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        content=message.content,
        read=message.read,
        created_at=message.created_at,
        is_mine=message.sender_id == current_user.id,
    )


def _get_peer_or_404(db: Session, current_user: User, peer_id: int) -> User:
    if peer_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="不能给自己发私信"
        )
    peer = db.get(User, peer_id)
    if peer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    return peer


def send_message(
    db: Session, current_user: User, peer_id: int, payload: MessageCreate
) -> MessagePublic:
    """发送私信。"""
    _get_peer_or_404(db, current_user, peer_id)
    message = Message(
        sender_id=current_user.id,
        receiver_id=peer_id,
        content=payload.content.strip(),
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return _to_public(message, current_user)


def get_conversation(
    db: Session, current_user: User, peer_id: int, limit: int = 200
) -> list[MessagePublic]:
    """与某用户的聊天记录（时间正序），同时把对方发来的消息标记为已读。"""
    _get_peer_or_404(db, current_user, peer_id)

    messages = db.scalars(
        select(Message)
        .where(
            or_(
                (Message.sender_id == current_user.id)
                & (Message.receiver_id == peer_id),
                (Message.sender_id == peer_id)
                & (Message.receiver_id == current_user.id),
            )
        )
        .order_by(Message.created_at.desc(), Message.id.desc())
        .limit(limit)
    ).all()

    # 标记对方发来的未读消息为已读
    db.execute(
        update(Message)
        .where(
            Message.sender_id == peer_id,
            Message.receiver_id == current_user.id,
            Message.read.is_(False),
        )
        .values(read=True)
    )
    db.commit()

    return [_to_public(m, current_user) for m in reversed(messages)]


def list_conversations(db: Session, current_user: User) -> list[ConversationSummary]:
    """会话列表：按最后一条消息时间倒序。"""
    messages = db.scalars(
        select(Message)
        .where(
            or_(
                Message.sender_id == current_user.id,
                Message.receiver_id == current_user.id,
            )
        )
        .order_by(Message.created_at.desc(), Message.id.desc())
        .limit(1000)
    ).all()

    summaries: dict[int, ConversationSummary] = {}
    for message in messages:
        peer = message.receiver if message.sender_id == current_user.id else message.sender
        if peer.id not in summaries:
            summaries[peer.id] = ConversationSummary(
                peer=PeerInfo.model_validate(peer),
                last_message=_to_public(message, current_user),
                unread_count=0,
            )
        if message.receiver_id == current_user.id and not message.read:
            summaries[peer.id].unread_count += 1

    return list(summaries.values())


def unread_count(db: Session, current_user: User) -> int:
    """全部未读私信数（导航栏徽章）。"""
    return int(
        db.scalar(
            select(func.count(Message.id)).where(
                Message.receiver_id == current_user.id,
                Message.read.is_(False),
            )
        )
        or 0
    )
