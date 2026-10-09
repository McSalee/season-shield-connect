import { createFileRoute, notFound } from "@tanstack/react-router";
import { EmptyState } from "@/components/admin/format";
import { BackLink, FarmerView } from "@/components/portal/FarmerView";
import { fetchFarmer } from "@/lib/farmers";

export const Route = createFileRoute("/admin/farmers/$id")({
  loader: async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) throw notFound();
    const detail = await fetchFarmer({ data: { id, charts: "full" } });
    if (!detail) throw notFound();
    return detail;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.farmer.name ?? "Farmer"} | GonaInsured admin` }],
  }),
  notFoundComponent: () => (
    <div className="space-y-4">
      <EmptyState>That farmer does not exist, or has not reached the portal yet.</EmptyState>
      <BackLink portal="admin" />
    </div>
  ),
  component: FarmerPage,
});

function FarmerPage() {
  return <FarmerView d={Route.useLoaderData()} portal="admin" />;
}
