"""活动相关 Pydantic Schema。"""

from datetime import date as date_type
from datetime import datetime
from datetime import time as time_type
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class EventCategory(str, Enum):
    """活动分类。"""

    ACADEMIC = "Academic"
    CLUB = "Club"
    SPORTS = "Sports"
    VOLUNTEER = "Volunteer"
    COMPETITION = "Competition"


class EventCreate(BaseModel):
    """创建活动请求体。"""

    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=5000)
    category: EventCategory
    location: str = Field(..., min_length=1, max_length=200)
    date: date_type
    time: time_type
    max_participants: int = Field(..., ge=2, le=10000)


class EventUpdate(BaseModel):
    """编辑活动请求体（仅创建者，所有字段可选）。"""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=5000)
    category: Optional[EventCategory] = None
    location: Optional[str] = Field(None, min_length=1, max_length=200)
    date: Optional[date_type] = None
    time: Optional[time_type] = None
    max_participants: Optional[int] = Field(None, ge=2, le=10000)


class EventCreatorInfo(BaseModel):
    """活动卡片上展示的创建者摘要。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    avatar_url: Optional[str] = None
    school: str


class EventMemberInfo(BaseModel):
    """活动成员摘要。"""

    id: int
    name: str
    avatar_url: Optional[str] = None
    school: str
    grade: str
    joined_at: datetime


class EventPublic(BaseModel):
    """活动列表/详情返回结构。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    category: EventCategory
    location: str
    date: date_type
    time: time_type
    max_participants: int
    status: str
    creator_id: int
    created_at: datetime

    creator: EventCreatorInfo
    member_count: int
    is_joined: bool
    is_creator: bool


class EventDetail(EventPublic):
    """详情页额外返回成员列表。"""

    members: list[EventMemberInfo] = Field(default_factory=list)
