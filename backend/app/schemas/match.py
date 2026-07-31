"""匹配相关 Pydantic Schema。"""

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class MatchedUserInfo(BaseModel):
    """匹配卡片上展示的用户摘要。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    avatar_url: Optional[str] = None
    school: str
    grade: str
    bio: Optional[str] = None
    interests: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    goals: list[str] = Field(default_factory=list)


class MatchResult(BaseModel):
    """单个匹配结果：分数 + 三个维度的共同标签。"""

    user: MatchedUserInfo
    score: int = Field(..., ge=0, le=100)
    common_interests: list[str] = Field(default_factory=list)
    common_skills: list[str] = Field(default_factory=list)
    common_goals: list[str] = Field(default_factory=list)
