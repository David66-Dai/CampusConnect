"""活动相关路由。"""

from typing import Any, Optional

from fastapi import APIRouter, Query

from typing import Literal

from app.core.deps import CurrentUser, DbSession
from app.schemas.event import EventCategory, EventCreate, EventUpdate
from app.services import event_service
from app.utils.response import success_response

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("")
def list_events(
    current_user: CurrentUser,
    db: DbSession,
    category: Optional[EventCategory] = Query(default=None),
    upcoming: bool = Query(default=False, description="只看未开始的活动"),
    mine: Optional[Literal["created", "joined"]] = Query(
        default=None, description="created=我创建的；joined=我加入的"
    ),
    limit: int = Query(default=50, ge=1, le=100),
) -> dict[str, Any]:
    """浏览活动列表。"""
    events = event_service.list_events(db, current_user, category, upcoming, mine, limit)
    return success_response(data=[e.model_dump() for e in events], message="ok")


@router.post("", status_code=201)
def create_event(
    payload: EventCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """创建活动（+20 XP，创建者自动加入）。"""
    event = event_service.create_event(db, current_user, payload)
    return success_response(data=event.model_dump(), message="活动创建成功")


@router.get("/{event_id}")
def get_event(
    event_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """活动详情（含成员列表）。"""
    event = event_service.get_event_detail(db, current_user, event_id)
    return success_response(data=event.model_dump(), message="ok")


@router.put("/{event_id}")
def update_event(
    event_id: int,
    payload: EventUpdate,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """编辑活动信息（仅发起人）。"""
    event = event_service.update_event(db, current_user, event_id, payload)
    return success_response(data=event.model_dump(), message="活动已更新")


@router.post("/{event_id}/end")
def end_event(
    event_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """结束活动（仅发起人），结束后不再接受报名。"""
    event = event_service.end_event(db, current_user, event_id)
    return success_response(data=event.model_dump(), message="活动已结束")


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """删除活动（仅发起人）。"""
    event_service.delete_event(db, current_user, event_id)
    return success_response(message="活动已删除")


@router.post("/{event_id}/join")
def join_event(
    event_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """加入活动（+10 XP）。"""
    event = event_service.join_event(db, current_user, event_id)
    return success_response(data=event.model_dump(), message="已加入活动")


@router.delete("/{event_id}/leave")
def leave_event(
    event_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """退出活动。"""
    event = event_service.leave_event(db, current_user, event_id)
    return success_response(data=event.model_dump(), message="已退出活动")
