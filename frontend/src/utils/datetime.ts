/** "2026-08-01" -> "8月1日 周六" */
export function formatEventDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
}

/** "14:00:00" -> "14:00" */
export function formatEventTime(time: string): string {
  return time.slice(0, 5);
}

/** 活动日期是否已过（今天之前） */
export function isPastDate(isoDate: string): boolean {
  const date = new Date(`${isoDate}T23:59:59`);
  return date.getTime() < Date.now();
}

/** 相对时间："刚刚"、"5 分钟前"、"3 小时前"、"2 天前"，超过 7 天显示日期 */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}
