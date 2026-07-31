"""商品相关 Pydantic Schema。"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ProductCategory(str, Enum):
    """商品分类。"""

    TEXTBOOK = "Textbook"
    ELECTRONICS = "Electronics"
    SPORTS = "Sports"
    OTHER = "Other"


class ProductCreate(BaseModel):
    """发布商品请求体。"""

    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=5000)
    price: float = Field(..., ge=0, le=99999999)
    category: ProductCategory
    image_url: Optional[str] = Field(None, max_length=512)


class ProductUpdate(BaseModel):
    """编辑商品请求体（仅卖家，所有字段可选）。"""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=5000)
    price: Optional[float] = Field(None, ge=0, le=99999999)
    category: Optional[ProductCategory] = None
    image_url: Optional[str] = Field(None, max_length=512)


class SellerInfo(BaseModel):
    """商品卡片上的卖家摘要。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    avatar_url: Optional[str] = None
    school: str
    grade: str


class ProductPublic(BaseModel):
    """商品列表/详情返回结构。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    seller_id: int
    title: str
    description: str
    price: float
    category: ProductCategory
    image_url: Optional[str] = None
    status: str
    created_at: datetime

    seller: SellerInfo
    is_seller: bool
