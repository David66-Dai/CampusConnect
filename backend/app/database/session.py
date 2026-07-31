"""SQLAlchemy 引擎、会话与 Base 声明基类。"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# pool_pre_ping：取连接前先探活，避免使用已断开的连接
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """所有 ORM 模型的声明基类。"""


def get_db() -> Generator[Session, None, None]:
    """FastAPI 依赖：为每个请求提供独立的数据库会话。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
