import type { ProductCategory } from "@/types/product";

/** 商品分类中文名与徽章配色 */
export const PRODUCT_CATEGORY_META: Record<
  ProductCategory,
  { label: string; className: string }
> = {
  Textbook: {
    label: "教材书籍",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  Electronics: {
    label: "电子设备",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
  Sports: {
    label: "体育用品",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  Other: {
    label: "其他闲置",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
};

/** 价格显示：0 显示"免费赠送"，其余保留两位小数去尾零 */
export function formatPrice(price: number): string {
  if (price === 0) return "免费赠送";
  return `¥${Number(price.toFixed(2))}`;
}
