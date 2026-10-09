import { createFileRoute } from "@tanstack/react-router";
import { PortalPlaceholder } from "@/components/portal/PortalPlaceholder";
import { fetchVisibleCounts } from "@/lib/portal";

export const Route = createFileRoute("/insurer/")({
  loader: () => fetchVisibleCounts(),
  head: () => ({ meta: [{ title: "Insurer portal | GonaInsured" }] }),
  component: InsurerHome,
});

function InsurerHome() {
  return (
    <PortalPlaceholder
      heading="Portfolio"
      intro="Cover, triggers and claims across the pilot, with the evidence behind each payout."
      counts={Route.useLoaderData()}
      next={[
        "Portfolio summary by cooperative and growth stage",
        "Claims with both trigger legs (weather index and satellite confirmation)",
        "Trigger report downloads",
      ]}
    />
  );
}
