import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  CreateProductPayload,
  Product,
  ProductCategory,
} from "@/types/product";

export async function fetchProducts(params?: {
  category?: ProductCategory;
  seller_id?: number;
  include_sold?: boolean;
  limit?: number;
}): Promise<Product[]> {
  const { data } = await api.get<ApiResponse<Product[]>>("/products", {
    params,
  });
  return data.data;
}

export async function fetchProductDetail(productId: number): Promise<Product> {
  const { data } = await api.get<ApiResponse<Product>>(
    `/products/${productId}`
  );
  return data.data;
}

export async function createProduct(
  payload: CreateProductPayload
): Promise<Product> {
  const { data } = await api.post<ApiResponse<Product>>("/products", payload);
  return data.data;
}

export async function updateProduct(
  productId: number,
  payload: Partial<CreateProductPayload>
): Promise<Product> {
  const { data } = await api.put<ApiResponse<Product>>(
    `/products/${productId}`,
    payload
  );
  return data.data;
}

export async function markProductSold(productId: number): Promise<Product> {
  const { data } = await api.post<ApiResponse<Product>>(
    `/products/${productId}/sold`
  );
  return data.data;
}

export async function deleteProduct(productId: number): Promise<void> {
  await api.delete(`/products/${productId}`);
}

/** 上传图片到后端（转存 Cloudinary），返回 URL */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ApiResponse<{ url: string }>>(
    "/uploads/image",
    form,
    { headers: { "Content-Type": "multipart/form-data" }, timeout: 60_000 }
  );
  return data.data.url;
}

/** 查询图片上传服务是否已配置 */
export async function fetchUploadStatus(): Promise<boolean> {
  const { data } = await api.get<ApiResponse<{ image_upload_enabled: boolean }>>(
    "/uploads/status"
  );
  return data.data.image_upload_enabled;
}
