"""健康检查接口：用于验证服务与数据库状态。"""

from typing import Any

from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.database.session import engine
from app.utils.response import success_response

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check() -> dict[str, Any]:
    """返回服务状态；数据库不可用时不阻塞服务本身。"""
    db_status = "connected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:  # noqa: BLE001 - 健康检查只关心可用性
        db_status = "unavailable"

    return success_response(
        data={
            "service": "ok",
            "database": db_status,
            **({"environment": settings.environment} if settings.is_development else {}),
        },
        message="CampusConnect API is running",
    )
