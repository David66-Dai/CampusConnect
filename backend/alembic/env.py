"""Alembic 迁移环境：数据库地址与模型元数据均来自应用配置。"""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

from app.core.config import settings
from app.database.session import Base

# 导入所有模型，保证 autogenerate 能发现表结构（后续 Phase 补充）
import app.models  # noqa: F401

config = context.config

# 数据库地址从 .env 读取，而不是写死在 alembic.ini
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """离线模式：不连接数据库，直接输出 SQL。"""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """在线模式：连接数据库执行迁移。"""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
