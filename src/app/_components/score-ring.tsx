import { ringOffset } from "@/app/_lib/view";

/** Circular score gauge from ST-07; the number is the deterministic total. */
export function ScoreRing({
  total,
  possible,
}: {
  total: number;
  possible: number;
}) {
  const circumference = 2 * Math.PI * 50;
  return (
    <div
      className="relative flex h-36 w-36 items-center justify-center"
      role="img"
      aria-label={`Skor ${total} dari ${possible}`}
    >
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle
          className="text-surface-container-highest"
          cx="60"
          cy="60"
          r="50"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="12"
        />
        <circle
          className="text-primary-container"
          cx="60"
          cy="60"
          r="50"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={ringOffset(total, possible, circumference)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-display-hero leading-none text-primary">
          {total}
        </span>
        <span className="mt-0.5 text-label-ui text-on-surface-variant">
          dari {possible}
        </span>
      </div>
    </div>
  );
}
