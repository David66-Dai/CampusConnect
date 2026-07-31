"""Cloudinary 图片上传：数据库只保存返回的 URL。"""

from io import BytesIO

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.core.config import settings

MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}


def is_configured() -> bool:
    """是否已配置 Cloudinary 凭据。"""
    return bool(
        settings.cloudinary_cloud_name
        and settings.cloudinary_api_key
        and settings.cloudinary_api_secret
    )


def _ensure_configured() -> None:
    if not is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="图片上传服务未配置：请在 backend/.env 填写 CLOUDINARY_* 三项后重启后端",
        )
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


def _verify_image_bytes(content: bytes) -> None:
    """用 Pillow 校验真实图片格式，防止伪造 Content-Type。"""
    try:
        with Image.open(BytesIO(content)) as img:
            fmt = (img.format or "").upper()
            img.verify()
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="文件不是有效的图片",
        ) from exc
    if fmt not in ALLOWED_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="仅支持 JPG / PNG / WebP / GIF 格式的图片",
        )


async def upload_image(file: UploadFile, folder: str = "campusconnect") -> str:
    """校验并上传图片，返回 CDN URL。"""
    _ensure_configured()

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="仅支持 JPG / PNG / WebP / GIF 格式的图片",
        )

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="图片不能超过 5 MB",
        )

    _verify_image_bytes(content)

    try:
        result = cloudinary.uploader.upload(
            content,
            folder=folder,
            resource_type="image",
        )
    except Exception as exc:  # noqa: BLE001
        detail = (
            f"图片上传失败：{exc}"
            if settings.is_development
            else "图片上传失败，请稍后重试"
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail,
        ) from exc

    return result["secure_url"]
