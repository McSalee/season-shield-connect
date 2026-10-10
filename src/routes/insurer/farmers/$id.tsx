import { createFileRoute, notFound } from "@tanstack/react-router";
import { EmptyState } from "@/components/admin/format";
import { BackLink, FarmerView } from "@/components/portal/FarmerView";
import { fetchFarmer } from "@/lib/farmers";

// Read-only, like the cooperative page: charts without stage results, only fully confirmed
// triggers, and no phone number (the database does not give insurers one).
export const Route = createFileRoute("/insurer/farmers/$id")({
  loader: async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) throw notFound();
    const detail = await fetchFarmer({ data: { id, charts: "shared" } });
    if (!detail) throw notFound();
    return detail;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.farmer.name ?? "Farmer"} | GonaInsured insurer portal` }],
  }),
  notFoundComponent: () => (
    <div className="space-y-4">
      <EmptyState>That farmer does not exist, or has not reached the portal yet.</EmptyState>
      <BackLink portal="insurer" />
    </div>
  ),
  component: FarmerPage,
});

function FarmerPage() {
  return <FarmerView d={Route.useLoaderData()} portal="insurer" />;
}
