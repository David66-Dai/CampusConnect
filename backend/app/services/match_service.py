"""学习伙伴匹配算法。

加权规则（与产品定义一致）：
- 兴趣相似度 50%
- 目标相似度 30%
- 技能相似度 20%

单维度相似度使用 Overlap 系数：|A ∩ B| / min(|A|, |B|)。
相比 Jaccard，它对标签数量少的新用户更友好（子集即满分）。
"""

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.match import Match
from app.models.user import User
from app.schemas.match import MatchedUserInfo, MatchResult

WEIGHT_INTERESTS = 0.5
WEIGHT_GOALS = 0.3
WEIGHT_SKILLS = 0.2


def _normalize(tags: list[str]) -> set[str]:
    return {t.strip().lower() for t in tags if t and t.strip()}


def _overlap_score(a: list[str], b: list[str]) -> float:
    """Overlap 系数，任一方为空则为 0。"""
    set_a, set_b = _normalize(a), _normalize(b)
    if not set_a or not set_b:
        return 0.0
    return len(set_a & set_b) / min(len(set_a), len(set_b))


def _common_tags(mine: list[str], theirs: list[str]) -> list[str]:
    """共同标签，保留对方的原始大小写形式。"""
    mine_set = _normalize(mine)
    return [t for t in theirs if t.strip().lower() in mine_set]


def compute_score(me: User, other: User) -> int:
    """计算 0-100 的加权匹配分。"""
    score = (
        WEIGHT_INTERESTS * _overlap_score(me.interests, other.interests)
        + WEIGHT_GOALS * _overlap_score(me.goals, other.goals)
        + WEIGHT_SKILLS * _overlap_score(me.skills, other.skills)
    )
    return round(score * 100)


def get_matches(db: Session, current_user: User, limit: int = 20) -> list[MatchResult]:
    """计算当前用户与所有其他用户的匹配度，落库快照后返回排序结果。"""
    others = db.scalars(select(User).where(User.id != current_user.id)).all()

    results = [
        MatchResult(
            user=MatchedUserInfo.model_validate(other),
            score=compute_score(current_user, other),
            common_interests=_common_tags(current_user.interests, other.interests),
            common_skills=_common_tags(current_user.skills, other.skills),
            common_goals=_common_tags(current_user.goals, other.goals),
        )
        for other in others
    ]
    results.sort(key=lambda r: r.score, reverse=True)
    results = results[:limit]

    # 覆盖式落库：删除旧快照，写入本次结果
    db.execute(delete(Match).where(Match.user_id == current_user.id))
    for r in results:
        db.add(
            Match(
                user_id=current_user.id,
                matched_user_id=r.user.id,
                score=r.score,
            )
        )
    db.commit()

    return results
