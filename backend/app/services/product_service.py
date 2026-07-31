"""商品业务逻辑：发布、浏览、详情、编辑、删除、标记卖掉。"""

from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.user import User
from app.schemas.product import (
    ProductCategory,
    ProductCreate,
    ProductPublic,
    ProductUpdate,
)
from app.services import xp_service


def _to_public(product: Product, current_user: User) -> ProductPublic:
    return ProductPublic(
        id=product.id,
        seller_id=product.seller_id,
        title=product.title,
        description=product.description,
        price=float(product.price),
        category=ProductCategory(product.category),
        image_url=product.image_url,
        status=product.status,
        created_at=product.created_at,
        seller=product.seller,
        is_seller=product.seller_id == current_user.id,
    )


def _get_own_product_or_403(db: Session, current_user: User, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在")
    if product.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="只有卖家可以执行此操作"
        )
    return product


def list_products(
    db: Session,
    current_user: User,
    category: Optional[ProductCategory] = None,
    seller_id: Optional[int] = None,
    include_sold: bool = False,
    limit: int = 50,
) -> list[ProductPublic]:
    """按发布时间倒序返回商品。

    默认只显示在售；seller_id 可筛某卖家；include_sold 含已卖掉。
    """
    query = select(Product).order_by(Product.created_at.desc())
    if category is not None:
        query = query.where(Product.category == category.value)
    if seller_id is not None:
        query = query.where(Product.seller_id == seller_id)
    if not include_sold:
        query = query.where(Product.status == "active")
    products = db.scalars(query.limit(limit)).all()
    return [_to_public(p, current_user) for p in products]


def get_product_detail(db: Session, current_user: User, product_id: int) -> ProductPublic:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在")
    return _to_public(product, current_user)


def create_product(
    db: Session, current_user: User, payload: ProductCreate
) -> ProductPublic:
    """发布商品并奖励 XP。"""
    product = Product(
        seller_id=current_user.id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        price=payload.price,
        category=payload.category.value,
        image_url=payload.image_url,
        status="active",
    )
    db.add(product)
    xp_service.add_xp(db, current_user, xp_service.XP_PUBLISH_PRODUCT)
    db.commit()
    db.refresh(product)
    return _to_public(product, current_user)


def update_product(
    db: Session, current_user: User, product_id: int, payload: ProductUpdate
) -> ProductPublic:
    """编辑商品（仅卖家）。"""
    product = _get_own_product_or_403(db, current_user, product_id)
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        if field == "category" and value is not None:
            value = value.value
        if isinstance(value, str):
            value = value.strip()
        setattr(product, field, value)
    db.add(product)
    db.commit()
    db.refresh(product)
    return _to_public(product, current_user)


def mark_sold(db: Session, current_user: User, product_id: int) -> ProductPublic:
    """标记商品为已卖掉（仅卖家）。"""
    product = _get_own_product_or_403(db, current_user, product_id)
    if product.status == "sold":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="商品已经卖掉了")
    product.status = "sold"
    db.add(product)
    db.commit()
    db.refresh(product)
    return _to_public(product, current_user)


def delete_product(db: Session, current_user: User, product_id: int) -> None:
    """删除商品（仅卖家）。"""
    product = _get_own_product_or_403(db, current_user, product_id)
    db.delete(product)
    db.commit()
