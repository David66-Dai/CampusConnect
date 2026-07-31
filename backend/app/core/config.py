"""应用配置：从环境变量 / .env 文件读取，全局唯一。"""

from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# 始终指向 backend/.env，避免从其他工作目录启动时读不到配置
_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_ENV_FILE = _BACKEND_ROOT / ".env"


class Settings(BaseSettings):
    """全局配置项，字段名与环境变量一一对应。"""

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # 基础
    app_name: str = "CampusConnect API"
    environment: str = "development"
    secret_key: str = "change-me-to-a-long-random-string"

    # JWT
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 天

    # 数据库
    database_url: str = (
        "postgresql+psycopg2://postgres:postgres@localhost:5432/campusconnect"
    )

    # 跨域来源，逗号分隔
    cors_origins: str = "http://localhost:3000"

    # 前端站点根 URL（密码重置链接等）
    frontend_url: str = "http://localhost:3000"

    # 图片上传（Cloudinary）
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    # 邮件 SMTP（忘记密码 / 更改邮箱）
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False

    # 预留 AI
    openai_api_key: str = ""
    gemini_api_key: str = ""

    @field_validator("smtp_password", mode="before")
    @classmethod
    def _strip_smtp_password_spaces(cls, value: object) -> object:
        """Gmail 应用专用密码常带空格，登录时需去掉。"""
        if isinstance(value, str):
            return value.replace(" ", "").strip()
        return value

    @field_validator(
        "smtp_host",
        "smtp_username",
        "smtp_from",
        "frontend_url",
        "environment",
        mode="before",
    )
    @classmethod
    def _strip_str(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        """解析逗号分隔的 CORS 来源列表。"""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    """缓存配置实例，避免重复读取 .env。"""
    return Settings()


settings = get_settings()
