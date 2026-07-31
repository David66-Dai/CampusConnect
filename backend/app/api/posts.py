"""社区帖子相关路由。"""

from typing import Any

from fastapi import APIRouter, Query

from app.core.deps import CurrentUser, DbSession
from app.schemas.post import CommentCreate, PostCreate
from app.services import post_service
from app.utils.response import success_response

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("")
def list_posts(
    current_user: CurrentUser,
    db: DbSession,
    limit: int = Query(default=50, ge=1, le=100),
) -> dict[str, Any]:
    """浏览帖子信息流（时间倒序）。"""
    posts = post_service.list_posts(db, current_user, limit)
    return success_response(data=[p.model_dump() for p in posts], message="ok")


@router.post("", status_code=201)
def create_post(
    payload: PostCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """发布帖子。"""
    post = post_service.create_post(db, current_user, payload)
    return success_response(data=post.model_dump(), message="发布成功")


@router.post("/{post_id}/like")
def toggle_like(
    post_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """点赞 / 取消点赞。"""
    result = post_service.toggle_like(db, current_user, post_id)
    return success_response(
        data=result.model_dump(),
        message="已点赞" if result.liked else "已取消点赞",
    )


@router.get("/{post_id}/comments")
def list_comments(
    post_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """评论列表（时间正序）。"""
    comments = post_service.list_comments(db, current_user, post_id)
    return success_response(data=[c.model_dump() for c in comments], message="ok")


@router.post("/{post_id}/comments", status_code=201)
def add_comment(
    post_id: int,
    payload: CommentCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """发表评论（+5 XP）。"""
    comment = post_service.add_comment(db, current_user, post_id, payload)
    return success_response(data=comment.model_dump(), message="评论成功")
