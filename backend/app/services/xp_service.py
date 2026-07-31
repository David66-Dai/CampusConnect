"""积分与等级：用户行为奖励 XP，按阈值自动升级。"""

from sqlalchemy.orm import Session

from app.models.user import User

# 各等级起始 XP：Lv1 从 0 起，Lv2 从 100 起，Lv3 从 300 起（与前端约定一致）
LEVEL_THRESHOLDS = [0, 100, 300]

# 行为奖励
XP_CREATE_EVENT = 20
XP_JOIN_EVENT = 10
XP_PUBLISH_PRODUCT = 10
XP_COMMENT = 5


def _level_for_xp(xp: int) -> int:
    level = 1
    for index, threshold in enumerate(LEVEL_THRESHOLDS, start=1):
        if xp >= threshold:
            level = index
    return level


def add_xp(db: Session, user: User, amount: int) -> None:
    """给用户加 XP 并重算等级。不单独 commit，由调用方统一提交。"""
    user.xp = max(0, user.xp + amount)
    user.level = _level_for_xp(user.xp)
    db.add(user)
