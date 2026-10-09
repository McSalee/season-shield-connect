import { createFileRoute, notFound } from "@tanstack/react-router";
import { EmptyState } from "@/components/admin/format";
import { BackLink, FarmerView } from "@/components/portal/FarmerView";
import { fetchFarmer } from "@/lib/farmers";

// Charts without stage results: cooperatives never see an advisory or a trigger that is
// not final (row-level security also gives them only fully confirmed stage results).
export const Route = createFileRoute("/cooperative/farmers/$id")({
  loader: async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) throw notFound();
    const detail = await fetchFarmer({ data: { id, charts: "shared" } });
    if (!detail) throw notFound();
    return detail;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.farmer.name ?? "Farmer"} | GonaInsured cooperative portal` }],
  }),
  notFoundComponent: () => (
    <div className="space-y-4">
      <EmptyState>That farmer is not one of your cooperative's members.</EmptyState>
      <BackLink portal="cooperative" />
    </div>
  ),
  component: FarmerPage,
});

function FarmerPage() {
  return <FarmerView d={Route.useLoaderData()} portal="cooperative" />;
}
