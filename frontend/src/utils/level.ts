/** 等级体系：与后端约定一致 */

export const LEVEL_NAMES: Record<number, string> = {
  1: "New Student",
  2: "Active Member",
  3: "Campus Leader",
};

/** 各等级起始 XP：Lv1 从 0 起，Lv2 从 100 起，Lv3 从 300 起 */
export const LEVEL_THRESHOLDS = [0, 100, 300];

export function getLevelName(level: number): string {
  return LEVEL_NAMES[level] ?? LEVEL_NAMES[3];
}

/** 距下一等级的进度（0-100）；满级返回 100 */
export function getLevelProgress(level: number, xp: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return 100;
  const current = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next = LEVEL_THRESHOLDS[level] ?? current;
  if (next <= current) return 100;
  const ratio = ((xp - current) / (next - current)) * 100;
  return Math.min(100, Math.max(0, Math.round(ratio)));
}

/** 距下一等级还差多少 XP；满级返回 null */
export function getXpToNextLevel(level: number, xp: number): number | null {
  if (level >= LEVEL_THRESHOLDS.length) return null;
  const next = LEVEL_THRESHOLDS[level];
  return Math.max(0, next - xp);
}
