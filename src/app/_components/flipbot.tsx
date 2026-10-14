import { Icon } from "@/app/_components/icon";

/** FlipBot avatar tile as used across the Stitch screens (smart_toy on a tile). */
export function FlipBotAvatar({
  size = "md",
  tone = "primary",
  status,
}: {
  size?: "sm" | "md" | "lg";
  tone?: "primary" | "secondary" | "soft";
  status?: "online" | "thinking";
}) {
  const box = { sm: "h-10 w-10", md: "h-14 w-14", lg: "h-24 w-24" }[size];
  const icon = { sm: 22, md: 30, lg: 52 }[size];
  const colors = {
    primary: "bg-primary-container text-on-primary",
    secondary: "bg-secondary-container text-on-secondary",
    soft: "bg-surface-container text-primary",
  }[tone];
  return (
    <div className="relative shrink-0">
      <div
        className={`${box} ${colors} flex items-center justify-center rounded-2xl shadow-sm`}
      >
        <Icon name="smart_toy" filled size={icon} />
      </div>
      {status ? (
        <span
          className={`absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full ring-2 ring-surface-container-lowest ${
            status === "thinking"
              ? "bg-secondary-container motion-safe:animate-pulse"
              : "bg-success"
          }`}
        />
      ) : null}
    </div>
  );
}

/** FlipBot speech bubble: cyan border, white card (DESIGN.md "FlipBot bubble"). */
export function FlipBotBubble({
  label = "FlipBot",
  badge,
  children,
  tone = "default",
}: {
  label?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "question";
}) {
  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <FlipBotAvatar size="sm" tone="soft" />
      <div
        className={`relative flex-1 rounded-2xl rounded-tl-sm border-[1.5px] p-4 shadow-sm ${
          tone === "question"
            ? "border-bubble-border bg-surface-container-low"
            : "border-bubble-border bg-surface-container-lowest"
        }`}
      >
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="text-label-ui text-primary">{label}</span>
          {badge}
        </div>
        <div className="text-body-md text-on-surface">{children}</div>
      </div>
    </div>
  );
}
