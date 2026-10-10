import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Eye, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_HOME, ROLE_LABEL, type AuthState, type Profile, type Role } from "@/lib/auth";
import { GonaMark, Wordmark } from "./Brand";
import { useSignOut } from "./useSignOut";

type SignedIn = NonNullable<AuthState> & { profile: Profile };

// Navigation per role. Admins can also look at the insurer view (read-only).
// `match`: URL prefixes that mark the item as current.
type NavItem = { to: string; label: string; match: string[] };
const NAV_FOR: Record<Role, NavItem[]> = {
  admin: [
    { to: "/admin", label: "Farmers", match: ["/admin/farmers"] },
    { to: "/admin/cooperatives", label: "Cooperatives", match: ["/admin/cooperatives"] },
    { to: "/admin/runs", label: "Worker runs", match: ["/admin/runs"] },
    { to: "/admin/organizations", label: "Organizations & users", match: ["/admin/organizations"] },
    { to: "/insurer", label: "Insurer portal (view)", match: ["/insurer"] },
  ],
  insurer: [
    { to: "/insurer", label: "Portfolio", match: [] },
    { to: "/insurer/claims", label: "Claims", match: ["/insurer/claims"] },
    { to: "/insurer/farmers", label: "Farmers", match: ["/insurer/farmers"] },
  ],
  cooperative: [
    { to: "/cooperative", label: "Farmers", match: ["/cooperative/farmers"] },
    { to: "/cooperative/agents", label: "Agents", match: ["/cooperative/agents"] },
  ],
};
const PORTAL_TITLE: Record<Role, string> = {
  admin: "Admin",
  cooperative: "Cooperative portal",
  insurer: "Insurer portal",
};

export function PortalShell({
  auth,
  portal,
  children,
}: {
  auth: SignedIn;
  portal: Role;
  children: ReactNode;
}) {
  const signOut = useSignOut();
  const { profile } = auth;
  const viewingAs = portal !== profile.role;
  // An admin in the insurer view gets that portal's sections and a way back.
  const nav = viewingAs
    ? [...NAV_FOR[portal], { to: "/admin", label: "Back to admin", match: [] }]
    : NAV_FOR[profile.role];
  const path = useRouterState({ select: (s) => s.location.pathname }).replace(/\/$/, "");
  const isCurrent = (item: NavItem) =>
    path === item.to || item.match.some((m) => path.startsWith(m));

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to={ROLE_HOME[profile.role]}
              className="flex shrink-0 items-center gap-2"
              aria-label="Portal home"
            >
              <GonaMark className="size-8" />
              <span className="hidden sm:inline">
                <Wordmark />
              </span>
            </Link>
            <span className="truncate rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
              {PORTAL_TITLE[portal]}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden min-w-0 text-right md:block">
              <p className="truncate text-sm font-semibold">{profile.fullName ?? auth.email}</p>
              <p className="truncate text-xs text-muted-foreground">
                {ROLE_LABEL[profile.role]}
                {profile.organization ? ` · ${profile.organization.name}` : ""}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut /> <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
        {nav.length > 0 && (
          <nav
            className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6"
            aria-label="Portal sections"
          >
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isCurrent(item) ? "page" : undefined}
                className={
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-secondary " +
                  (isCurrent(item) ? "bg-secondary text-primary" : "text-muted-foreground")
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      {viewingAs && (
        <div className="border-b bg-sun/20 text-sun-foreground">
          <p className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-sm font-medium sm:px-6">
            <Eye className="size-4 shrink-0" /> You are viewing the{" "}
            {PORTAL_TITLE[portal].toLowerCase()} as a GonaInsured admin.
          </p>
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
