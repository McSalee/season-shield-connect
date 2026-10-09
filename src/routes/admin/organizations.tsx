import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Landmark, ShieldCheck, Users } from "lucide-react";
import { EmptyState, PageHeader, Pill } from "@/components/admin/format";
import { fmtDate } from "@/lib/format";
import { fetchOrganizations, type OrganizationRow } from "@/lib/admin";
import { ROLE_LABEL, type Role } from "@/lib/auth";

export const Route = createFileRoute("/admin/organizations")({
  loader: () => fetchOrganizations(),
  head: () => ({ meta: [{ title: "Organizations & users | GonaInsured admin" }] }),
  component: OrganizationsPage,
});

const INVITE_COMMAND =
  'python tools/invite_user.py --email name@example.com --role cooperative --org "Organization name"';

const KIND = {
  gonainsured: { label: "GonaInsured", icon: ShieldCheck },
  cooperative: { label: "Cooperative", icon: Building2 },
  insurer: { label: "Insurer", icon: Landmark },
} as const;

function OrganizationsPage() {
  const orgs = Route.useLoaderData();
  const users = orgs.reduce((n, o) => n + o.users.length, 0);
  return (
    <div>
      <PageHeader
        title="Organizations & users"
        intro={`${orgs.length} organization${orgs.length === 1 ? "" : "s"}, ${users} portal user${users === 1 ? "" : "s"}.`}
      />
      <section className="mb-6 rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-bold">Inviting a user</h2>
        <p className="mt-1 text-muted-foreground">
          Invitations are sent from the engine computer (the service key stays off the web server).
          The organization name must match exactly:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-secondary/60 p-3 text-xs">
          {INVITE_COMMAND}
        </pre>
        <p className="mt-2 text-xs text-muted-foreground">
          Roles: admin (GonaInsured), cooperative, insurer. Needs SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY and PORTAL_URL.
        </p>
      </section>
      {orgs.length === 0 ? (
        <EmptyState>No organizations yet.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {orgs.map((o) => (
            <OrgCard key={o.id} org={o} />
          ))}
        </ul>
      )}
    </div>
  );
}

function OrgCard({ org: o }: { org: OrganizationRow }) {
  const { label, icon: Icon } = KIND[o.kind];
  return (
    <li className="rounded-xl border bg-card p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h2 className="font-bold">{o.name}</h2>
        <Pill>{label}</Pill>
        {o.cooperative?.needsReview && (
          <Link to="/admin/cooperatives">
            <Pill tone="warn">Needs review</Pill>
          </Link>
        )}
        <span className="text-xs text-muted-foreground">added {fmtDate(o.createdAt)}</span>
      </div>
      {o.users.length === 0 ? (
        <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
          <Users className="size-3.5" /> No portal users
        </p>
      ) : (
        <ul className="mt-3 divide-y rounded-lg border">
          {o.users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{u.name ?? u.email ?? u.id}</p>
                {u.name && <p className="truncate text-xs text-muted-foreground">{u.email}</p>}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Pill>{ROLE_LABEL[u.role as Role] ?? u.role}</Pill>
                since {fmtDate(u.createdAt)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
