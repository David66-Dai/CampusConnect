"""活动与活动成员 ORM 模型。"""

from datetime import date as date_type
from datetime import datetime
from datetime import time as time_type

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.user import User


class Event(Base):
    """校园活动。"""

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(200), nullable=False)
    date: Mapped[date_type] = mapped_column(Date, nullable=False, index=True)
    time: Mapped[time_type] = mapped_column(Time, nullable=False)
    max_participants: Mapped[int] = mapped_column(Integer, nullable=False)
    # active：进行中；ended：发起人已结束报名
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active", server_default="active"
    )
    creator_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    creator: Mapped[User] = relationship(User, lazy="joined")
    members: Mapped[list["EventMember"]] = relationship(
        back_populates="event",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class EventMember(Base):
    """活动成员（含创建者本人）。"""

    __tablename__ = "event_members"
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_members_event_user"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    event: Mapped[Event] = relationship(back_populates="members")
    user: Mapped[User] = relationship(User, lazy="joined")
