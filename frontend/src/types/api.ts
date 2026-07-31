/**
 * 后端统一响应结构：
 * { success: boolean, data: T, message: string }
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

/** 分页数据结构（后续列表接口使用） */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
