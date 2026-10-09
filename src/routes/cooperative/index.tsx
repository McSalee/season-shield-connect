import { createFileRoute } from "@tanstack/react-router";
import { PortalPlaceholder } from "@/components/portal/PortalPlaceholder";
import { fetchVisibleCounts } from "@/lib/portal";

export const Route = createFileRoute("/cooperative/")({
  loader: () => fetchVisibleCounts(),
  head: () => ({ meta: [{ title: "Cooperative portal | GonaInsured" }] }),
  component: CooperativeHome,
});

function CooperativeHome() {
  const { auth } = Route.useRouteContext();
  return (
    <PortalPlaceholder
      heading={auth.profile.organization?.name ?? "Your cooperative"}
      intro="Your members' cover status, advisories and messages."
      counts={Route.useLoaderData()}
      next={[
        "Your farmers and their current status",
        "Advisories and messages sent to each farmer",
        "Your community agents",
      ]}
    />
  );
}
