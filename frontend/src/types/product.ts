export const PRODUCT_CATEGORIES = [
  "Textbook",
  "Electronics",
  "Sports",
  "Other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type SellerInfo = {
  id: number;
  name: string;
  avatar_url: string | null;
  school: string;
  grade: string;
};

export type Product = {
  id: number;
  seller_id: number;
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  image_url: string | null;
  /** active：在售；sold：已卖掉 */
  status: "active" | "sold";
  created_at: string;
  seller: SellerInfo;
  is_seller: boolean;
};

export type CreateProductPayload = {
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  image_url?: string | null;
};
