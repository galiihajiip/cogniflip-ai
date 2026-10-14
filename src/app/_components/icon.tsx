/** Self-hosted Material Symbols subset; add new names to the font subset (docs/22). */
export function Icon({
  name,
  filled = false,
  className = "",
  size = 20,
}: {
  name: string;
  filled?: boolean;
  className?: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={`icon ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}`,
      }}
    >
      {name}
    </span>
  );
}
