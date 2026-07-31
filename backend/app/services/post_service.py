"""社区业务逻辑：发帖、信息流、点赞、评论。"""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.post import Comment, Post, PostLike
from app.models.user import User
from app.schemas.post import (
    AuthorInfo,
    CommentCreate,
    CommentPublic,
    LikeResult,
    PostCreate,
    PostPublic,
)
from app.services import xp_service


def _to_public(post: Post, current_user: User) -> PostPublic:
    return PostPublic(
        id=post.id,
        author_id=post.author_id,
        content=post.content,
        image_url=post.image_url,
        created_at=post.created_at,
        author=AuthorInfo.model_validate(post.author),
        like_count=len(post.likes),
        comment_count=len(post.comments),
        is_liked=any(like.user_id == current_user.id for like in post.likes),
        is_author=post.author_id == current_user.id,
    )


def _comment_to_public(comment: Comment, current_user: User) -> CommentPublic:
    return CommentPublic(
        id=comment.id,
        post_id=comment.post_id,
        content=comment.content,
        created_at=comment.created_at,
        author=AuthorInfo.model_validate(comment.user),
        is_author=comment.user_id == current_user.id,
    )


def _get_post_or_404(db: Session, post_id: int) -> Post:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="帖子不存在")
    return post


def list_posts(db: Session, current_user: User, limit: int = 50) -> list[PostPublic]:
    """信息流：按发布时间倒序。"""
    posts = db.scalars(
        select(Post).order_by(Post.created_at.desc(), Post.id.desc()).limit(limit)
    ).all()
    return [_to_public(p, current_user) for p in posts]


def create_post(db: Session, current_user: User, payload: PostCreate) -> PostPublic:
    """发布帖子。"""
    post = Post(
        author_id=current_user.id,
        content=payload.content.strip(),
        image_url=payload.image_url,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return _to_public(post, current_user)


def toggle_like(db: Session, current_user: User, post_id: int) -> LikeResult:
    """点赞 / 取消点赞切换。"""
    post = _get_post_or_404(db, post_id)

    existing = db.scalar(
        select(PostLike).where(
            PostLike.post_id == post_id, PostLike.user_id == current_user.id
        )
    )
    if existing is not None:
        db.delete(existing)
        liked = False
    else:
        db.add(PostLike(post_id=post_id, user_id=current_user.id))
        liked = True
    db.commit()
    db.refresh(post)
    return LikeResult(post_id=post_id, liked=liked, like_count=len(post.likes))


def list_comments(db: Session, current_user: User, post_id: int) -> list[CommentPublic]:
    """评论列表：按时间正序。"""
    post = _get_post_or_404(db, post_id)
    ordered = sorted(post.comments, key=lambda c: (c.created_at, c.id))
    return [_comment_to_public(c, current_user) for c in ordered]


def add_comment(
    db: Session, current_user: User, post_id: int, payload: CommentCreate
) -> CommentPublic:
    """发表评论（+5 XP）。"""
    _get_post_or_404(db, post_id)

    comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        content=payload.content.strip(),
    )
    db.add(comment)
    xp_service.add_xp(db, current_user, xp_service.XP_COMMENT)
    db.commit()
    db.refresh(comment)
    return _comment_to_public(comment, current_user)
