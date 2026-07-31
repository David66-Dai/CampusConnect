"""用户查询相关业务逻辑。"""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.event import Event
from app.models.post import Post
from app.models.user import User
from app.schemas.user import RecommendedUser, UserProfilePublic
from app.services import event_service, post_service, product_service


def get_recommended_partners(
    db: Session, current_user: User, limit: int = 6
) -> list[RecommendedUser]:
    """按共同兴趣数量推荐伙伴。

    排序规则：共同兴趣数降序 > 同校优先 > 注册时间新的优先。
    """
    others = db.scalars(select(User).where(User.id != current_user.id)).all()
    my_interests = {i.lower() for i in current_user.interests}

    def _common(user: User) -> list[str]:
        return [i for i in user.interests if i.lower() in my_interests]

    ranked = sorted(
        others,
        key=lambda u: (
            len(_common(u)),
            u.school == current_user.school,
            u.created_at,
        ),
        reverse=True,
    )

    return [
        RecommendedUser(
            id=u.id,
            name=u.name,
            avatar_url=u.avatar_url,
            school=u.school,
            grade=u.grade,
            bio=u.bio,
            interests=list(u.interests or []),
            skills=list(u.skills or []),
            goals=list(u.goals or []),
            xp=u.xp,
            level=u.level,
            common_interests=_common(u),
        )
        for u in ranked[:limit]
    ]


def get_user_profile(
    db: Session, current_user: User, user_id: int
) -> UserProfilePublic:
    """组装他人主页：公开资料 + 近期创建的活动 / 商品 / 帖子。"""
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

    created_events = db.scalars(
        select(Event)
        .where(Event.creator_id == user_id)
        .order_by(Event.date.desc(), Event.time.desc())
        .limit(12)
    ).all()
    event_payloads = [
        event_service._to_public(e, current_user).model_dump() for e in created_events
    ]

    products = product_service.list_products(
        db,
        current_user,
        seller_id=user_id,
        include_sold=True,
        limit=12,
    )

    posts_raw = db.scalars(
        select(Post)
        .where(Post.author_id == user_id)
        .order_by(Post.created_at.desc())
        .limit(12)
    ).all()
    post_payloads = [
        post_service._to_public(p, current_user).model_dump() for p in posts_raw
    ]

    return UserProfilePublic(
        id=user.id,
        name=user.name,
        avatar_url=user.avatar_url,
        school=user.school,
        grade=user.grade,
        bio=user.bio,
        interests=user.interests or [],
        skills=user.skills or [],
        goals=user.goals or [],
        xp=user.xp,
        level=user.level,
        created_at=user.created_at,
        is_self=user.id == current_user.id,
        events=event_payloads,
        products=[p.model_dump() for p in products],
        posts=post_payloads,
    )
