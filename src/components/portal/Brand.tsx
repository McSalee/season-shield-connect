import { useId } from "react";
import { cn } from "@/lib/utils";

// The GonaInsured mark (same shape as the landing page and /demo), with a unique gradient id.
export function GonaMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("size-9 shrink-0", className)}>
      <defs>
        <linearGradient id={id} x1="48" y1="7" x2="15" y2="57" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-leaf)" />
          <stop offset="1" stopColor="var(--color-primary)" />
        </linearGradient>
      </defs>
      <path
        d="M4 31C4 16.1 16.1 4 31 4h25v13.5a7.5 7.5 0 0 1-7.5 7.5H39c-7.7 0-14 6.3-14 14v3H4V31Z"
        fill={`url(#${id})`}
      />
      <path
        d="M4 31v29h27c16 0 29-13 29-29v-6H45v6c0 7.7-6.3 14-14 14h-6V31H4Z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="whitespace-nowrap text-xl font-extrabold leading-none">
      <span className="text-foreground">Gona</span>
      <span className="text-sun">Insured</span>
    </span>
  );
}
