import type { EventCategory } from "@/types/event";

/** 分类的中文名与徽章配色 */
export const CATEGORY_META: Record<
  EventCategory,
  { label: string; className: string }
> = {
  Academic: {
    label: "学术",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  Club: {
    label: "社团",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
  Sports: {
    label: "体育",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  Volunteer: {
    label: "志愿",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  Competition: {
    label: "比赛",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  },
};
