"""统一 API 响应结构：{ success, data, message }。"""

from typing import Any


def success_response(data: Any = None, message: str = "") -> dict[str, Any]:
    """构造成功响应。"""
    return {"success": True, "data": data, "message": message}


def error_response(message: str, data: Any = None) -> dict[str, Any]:
    """构造失败响应（配合 HTTP 状态码使用）。"""
    return {"success": False, "data": data, "message": message}
