import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader, Pill } from "@/components/admin/format";
import { fetchAgents } from "@/lib/cooperative";

export const Route = createFileRoute("/cooperative/agents")({
  loader: () => fetchAgents(),
  head: () => ({ meta: [{ title: "Agents | GonaInsured cooperative portal" }] }),
  component: AgentsPage,
});

function AgentsPage() {
  const agents = Route.useLoaderData();
  return (
    <div>
      <PageHeader
        title="Community agents"
        intro="The agents who enrol and support your members. To add or change an agent, contact GonaInsured."
      />
      {agents.length === 0 ? (
        <EmptyState>
          No agents recorded for your cooperative yet. GonaInsured adds them from your member list.
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => (
            <li key={a.id} className="rounded-xl border bg-card p-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{a.code}</p>
                </div>
                {!a.active && <Pill>Inactive</Pill>}
              </div>
              <p className="mt-2 text-muted-foreground">
                <span className="tabular-nums">{a.phone ?? "No phone"}</span> · {a.farmers} farmer
                {a.farmers === 1 ? "" : "s"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
