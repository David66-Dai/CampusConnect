"""商品相关路由。"""

from typing import Any, Optional

from fastapi import APIRouter, Query

from app.core.deps import CurrentUser, DbSession
from app.schemas.product import ProductCategory, ProductCreate, ProductUpdate
from app.services import product_service
from app.utils.response import success_response

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("")
def list_products(
    current_user: CurrentUser,
    db: DbSession,
    category: Optional[ProductCategory] = Query(default=None),
    seller_id: Optional[int] = Query(default=None, description="按卖家筛选"),
    include_sold: bool = Query(default=False, description="是否包含已卖掉"),
    limit: int = Query(default=50, ge=1, le=100),
) -> dict[str, Any]:
    """浏览商品列表（发布时间倒序，默认只看在售）。"""
    products = product_service.list_products(
        db, current_user, category, seller_id, include_sold, limit
    )
    return success_response(data=[p.model_dump() for p in products], message="ok")


@router.post("", status_code=201)
def create_product(
    payload: ProductCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """发布商品（+10 XP）。"""
    product = product_service.create_product(db, current_user, payload)
    return success_response(data=product.model_dump(), message="商品发布成功")


@router.get("/{product_id}")
def get_product(
    product_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """商品详情。"""
    product = product_service.get_product_detail(db, current_user, product_id)
    return success_response(data=product.model_dump(), message="ok")


@router.put("/{product_id}")
def update_product(
    product_id: int,
    payload: ProductUpdate,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """编辑商品（仅卖家）。"""
    product = product_service.update_product(db, current_user, product_id, payload)
    return success_response(data=product.model_dump(), message="商品已更新")


@router.post("/{product_id}/sold")
def mark_sold(
    product_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """标记商品为已卖掉（仅卖家）。"""
    product = product_service.mark_sold(db, current_user, product_id)
    return success_response(data=product.model_dump(), message="已标记为卖掉")


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """删除商品（仅卖家）。"""
    product_service.delete_product(db, current_user, product_id)
    return success_response(message="商品已删除")
