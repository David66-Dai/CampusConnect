"""CampusConnect API 入口。"""

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.auth import router as auth_router
from app.api.events import router as events_router
from app.api.health import router as health_router
from app.api.matches import router as matches_router
from app.api.messages import router as messages_router
from app.api.posts import router as posts_router
from app.api.products import router as products_router
from app.api.uploads import router as uploads_router
from app.api.users import router as users_router
from app.core.config import _ENV_FILE, settings
from app.services import email_service
from app.utils.response import error_response

logger = logging.getLogger(__name__)

_DEFAULT_SECRET = "change-me-to-a-long-random-string"

if settings.is_production and settings.secret_key == _DEFAULT_SECRET:
    raise RuntimeError(
        "Refusing to start: set a strong SECRET_KEY in backend/.env for production"
    )

if settings.is_production and not settings.secret_key.strip():
    raise RuntimeError("Refusing to start: SECRET_KEY is empty")

logger.info(
    "CampusConnect starting: environment=%s smtp_configured=%s env_file=%s",
    settings.environment,
    email_service.is_smtp_configured(),
    _ENV_FILE,
)

app = FastAPI(
    title=settings.app_name,
    description="CampusConnect —— 面向高中生和大学生的校园社区平台 API",
    version="0.1.0",
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    _request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """把 HTTPException 转成统一响应结构。"""
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(message=str(exc.detail)),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    """参数校验失败时返回统一响应结构与字段错误详情。"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response(message="参数校验失败", data=exc.errors()),
    )


app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(events_router, prefix="/api")
app.include_router(matches_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(posts_router, prefix="/api")
app.include_router(messages_router, prefix="/api")
app.include_router(uploads_router, prefix="/api")
