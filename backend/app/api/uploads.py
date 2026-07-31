"""图片上传路由。"""

from typing import Any

from fastapi import APIRouter, UploadFile

from app.core.deps import CurrentUser
from app.services import upload_service
from app.utils.response import success_response

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post("/image")
async def upload_image(file: UploadFile, _current_user: CurrentUser) -> dict[str, Any]:
    """上传图片到 Cloudinary，返回 URL。"""
    url = await upload_service.upload_image(file)
    return success_response(data={"url": url}, message="上传成功")


@router.get("/status")
def upload_status(_current_user: CurrentUser) -> dict[str, Any]:
    """查询上传服务是否可用（前端据此隐藏/显示上传控件）。"""
    return success_response(
        data={"image_upload_enabled": upload_service.is_configured()},
        message="ok",
    )
