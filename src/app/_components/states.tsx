import { Icon } from "@/app/_components/icon";

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="card flex items-center gap-3 p-6 text-on-surface-variant"
    >
      <Icon
        name="progress_activity"
        className="text-primary motion-safe:animate-spin"
        size={24}
      />
      <span className="text-body-md">{label}</span>
    </div>
  );
}

export function ErrorBlock({
  title = "Ups, ada kendala",
  message,
  onRetry,
  retryLabel = "Coba lagi",
  children,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className="card flex flex-col gap-4 border-error-container p-6 sm:flex-row sm:items-start"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-error-container text-on-error-container">
        <Icon name="cloud_off" size={26} />
      </span>
      <div className="flex-1 space-y-2">
        <h2 className="text-headline-sm text-on-surface">{title}</h2>
        <p className="text-body-md text-on-surface-variant">{message}</p>
        {children}
        {onRetry ? (
          <button
            type="button"
            className="btn-secondary mt-2"
            onClick={onRetry}
          >
            <Icon name="refresh" />
            {retryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyBlock({
  icon = "info",
  title,
  children,
}: {
  icon?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-primary">
        <Icon name={icon} size={28} />
      </span>
      <h2 className="text-headline-sm text-on-surface">{title}</h2>
      {children ? (
        <div className="max-w-prose text-body-md text-on-surface-variant">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** Page container matching the Stitch `max-w-7xl px-6 lg:px-12` frame. */
export function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-12">
      {children}
    </div>
  );
}

/** Pill chip used for stage breadcrumbs and badges. */
export function Chip({
  tone = "neutral",
  icon,
  children,
}: {
  tone?: "neutral" | "primary" | "secondary" | "tertiary" | "error" | "success";
  icon?: string;
  children: React.ReactNode;
}) {
  const colors = {
    neutral: "bg-surface-container text-on-surface-variant",
    primary: "bg-primary-fixed text-on-primary-fixed-variant",
    secondary: "bg-secondary-fixed text-on-secondary-fixed",
    tertiary: "bg-tertiary-fixed text-on-tertiary-fixed",
    error: "bg-error-container text-on-error-container",
    success: "bg-tertiary-fixed text-on-tertiary-fixed",
  }[tone];
  return (
    <span className={`chip ${colors}`}>
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </span>
  );
}
