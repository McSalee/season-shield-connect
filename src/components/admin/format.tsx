import { cn } from "@/lib/utils";
import { STATUS_LABEL, type FarmerStatus } from "@/lib/farmers";

const STATUS_STYLE: Record<FarmerStatus, string> = {
  normal: "bg-leaf/15 text-leaf",
  stress_detected: "bg-sun/25 text-sun-foreground",
  trigger_confirmed: "bg-destructive/15 text-destructive",
};
const STATUS_DOT: Record<FarmerStatus, string> = {
  normal: "bg-leaf",
  stress_detected: "bg-sun",
  trigger_confirmed: "bg-destructive",
};

// seasonOver: the status is the finished season's outcome, not a live condition, so it is
// shown in grey rather than the status colour.
export function StatusBadge({
  status,
  seasonOver = false,
  className,
}: {
  status: FarmerStatus;
  seasonOver?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold",
        seasonOver
          ? "bg-neutral-200/70 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
          : STATUS_STYLE[status],
        className,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", seasonOver ? "bg-neutral-400" : STATUS_DOT[status])}
        aria-hidden="true"
      />
      {STATUS_LABEL[status]}
      {seasonOver && <span className="font-normal opacity-75">(season ended)</span>}
    </span>
  );
}

export function Pill({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "good" | "warn" | "bad";
  children: React.ReactNode;
}) {
  const style = {
    muted: "bg-secondary text-muted-foreground",
    good: "bg-leaf/15 text-leaf",
    warn: "bg-sun/25 text-sun-foreground",
    bad: "bg-destructive/15 text-destructive",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold",
        style,
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {intro && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{intro}</p>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed bg-card px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
