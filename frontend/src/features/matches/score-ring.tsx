import { cn } from "@/lib/utils";

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** 环形匹配度分数（0-100） */
export function ScoreRing({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  const tone =
    clamped >= 70
      ? "text-emerald-500"
      : clamped >= 40
        ? "text-primary"
        : "text-muted-foreground/60";

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="none"
          strokeWidth="6"
          className="stroke-secondary"
        />
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={cn("stroke-current transition-all", tone)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
        {clamped}
      </span>
    </div>
  );
}
