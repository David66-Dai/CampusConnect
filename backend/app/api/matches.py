"""匹配相关路由。"""

from typing import Any

from fastapi import APIRouter, Query

from app.core.deps import CurrentUser, DbSession
from app.services import match_service
from app.utils.response import success_response

router = APIRouter(prefix="/matches", tags=["Matches"])


@router.get("")
def get_matches(
    current_user: CurrentUser,
    db: DbSession,
    limit: int = Query(default=20, ge=1, le=50),
) -> dict[str, Any]:
    """获取推荐伙伴：按加权匹配度（兴趣 50% / 目标 30% / 技能 20%）降序。"""
    matches = match_service.get_matches(db, current_user, limit)
    return success_response(data=[m.model_dump() for m in matches], message="ok")
