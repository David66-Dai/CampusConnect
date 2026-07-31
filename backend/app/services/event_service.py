"""活动业务逻辑：浏览、创建、加入、退出。"""

from datetime import date as date_type
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.event import Event, EventMember
from app.models.user import User
from app.schemas.event import (
    EventCategory,
    EventCreate,
    EventDetail,
    EventMemberInfo,
    EventPublic,
    EventUpdate,
)
from app.services import xp_service


def _to_public(event: Event, current_user: User) -> EventPublic:
    member_ids = {m.user_id for m in event.members}
    return EventPublic(
        id=event.id,
        title=event.title,
        description=event.description,
        category=EventCategory(event.category),
        location=event.location,
        date=event.date,
        time=event.time,
        max_participants=event.max_participants,
        status=event.status,
        creator_id=event.creator_id,
        created_at=event.created_at,
        creator=event.creator,
        member_count=len(event.members),
        is_joined=current_user.id in member_ids,
        is_creator=event.creator_id == current_user.id,
    )


def _to_detail(event: Event, current_user: User) -> EventDetail:
    base = _to_public(event, current_user)
    members = [
        EventMemberInfo(
            id=m.user.id,
            name=m.user.name,
            avatar_url=m.user.avatar_url,
            school=m.user.school,
            grade=m.user.grade,
            joined_at=m.joined_at,
        )
        for m in sorted(event.members, key=lambda m: m.joined_at)
    ]
    return EventDetail(**base.model_dump(), members=members)


def _get_event_or_404(db: Session, event_id: int) -> Event:
    event = db.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="活动不存在")
    return event


def list_events(
    db: Session,
    current_user: User,
    category: Optional[EventCategory] = None,
    upcoming_only: bool = False,
    mine: Optional[str] = None,
    limit: int = 50,
) -> list[EventPublic]:
    """按日期升序返回活动。

    mine="created"：我创建的；mine="joined"：我加入的（不含自己创建的）。
    """
    query = select(Event).order_by(Event.date.asc(), Event.time.asc())
    if category is not None:
        query = query.where(Event.category == category.value)
    if upcoming_only:
        query = query.where(Event.date >= date_type.today())
    if mine == "created":
        query = query.where(Event.creator_id == current_user.id)
    elif mine == "joined":
        query = query.join(EventMember, EventMember.event_id == Event.id).where(
            EventMember.user_id == current_user.id,
            Event.creator_id != current_user.id,
        )
    events = db.scalars(query.limit(limit)).all()
    return [_to_public(e, current_user) for e in events]


def get_event_detail(db: Session, current_user: User, event_id: int) -> EventDetail:
    return _to_detail(_get_event_or_404(db, event_id), current_user)


def create_event(db: Session, current_user: User, payload: EventCreate) -> EventDetail:
    """创建活动：创建者自动成为成员，并奖励 XP。"""
    event = Event(
        title=payload.title.strip(),
        description=payload.description.strip(),
        category=payload.category.value,
        location=payload.location.strip(),
        date=payload.date,
        time=payload.time,
        max_participants=payload.max_participants,
        creator_id=current_user.id,
    )
    event.members.append(EventMember(user_id=current_user.id))
    db.add(event)
    xp_service.add_xp(db, current_user, xp_service.XP_CREATE_EVENT)
    db.commit()
    db.refresh(event)
    return _to_detail(event, current_user)


def join_event(db: Session, current_user: User, event_id: int) -> EventDetail:
    """加入活动：已结束、满员或重复加入时报错，成功后奖励 XP。"""
    event = _get_event_or_404(db, event_id)

    if event.status == "ended":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="活动已结束，无法加入")
    if any(m.user_id == current_user.id for m in event.members):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="你已加入该活动")
    if len(event.members) >= event.max_participants:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="活动人数已满")

    db.add(EventMember(event_id=event.id, user_id=current_user.id))
    xp_service.add_xp(db, current_user, xp_service.XP_JOIN_EVENT)
    db.commit()
    db.refresh(event)
    return _to_detail(event, current_user)


def _get_own_event_or_403(db: Session, current_user: User, event_id: int) -> Event:
    """获取活动并校验当前用户是创建者。"""
    event = _get_event_or_404(db, event_id)
    if event.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="只有活动发起人可以执行此操作"
        )
    return event


def update_event(
    db: Session, current_user: User, event_id: int, payload: EventUpdate
) -> EventDetail:
    """编辑活动信息（仅创建者；人数上限不能低于当前成员数）。"""
    event = _get_own_event_or_403(db, current_user, event_id)

    data = payload.model_dump(exclude_unset=True)
    new_max = data.get("max_participants")
    if new_max is not None and new_max < len(event.members):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"人数上限不能低于当前成员数（{len(event.members)} 人）",
        )

    for field, value in data.items():
        if field == "category" and value is not None:
            value = value.value
        if isinstance(value, str):
            value = value.strip()
        setattr(event, field, value)

    db.add(event)
    db.commit()
    db.refresh(event)
    return _to_detail(event, current_user)


def end_event(db: Session, current_user: User, event_id: int) -> EventDetail:
    """结束活动（仅创建者）：不再接受新成员。"""
    event = _get_own_event_or_403(db, current_user, event_id)
    if event.status == "ended":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="活动已经结束了")
    event.status = "ended"
    db.add(event)
    db.commit()
    db.refresh(event)
    return _to_detail(event, current_user)


def delete_event(db: Session, current_user: User, event_id: int) -> None:
    """删除活动（仅创建者）：级联删除成员记录。"""
    event = _get_own_event_or_403(db, current_user, event_id)
    db.delete(event)
    db.commit()


def leave_event(db: Session, current_user: User, event_id: int) -> EventDetail:
    """退出活动：创建者不可退出自己创建的活动。"""
    event = _get_event_or_404(db, event_id)

    if event.creator_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="创建者不能退出自己创建的活动"
        )

    membership = db.scalar(
        select(EventMember).where(
            EventMember.event_id == event_id,
            EventMember.user_id == current_user.id,
        )
    )
    if membership is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="你尚未加入该活动")

    db.delete(membership)
    xp_service.add_xp(db, current_user, -xp_service.XP_JOIN_EVENT)
    db.commit()
    db.refresh(event)
    return _to_detail(event, current_user)
