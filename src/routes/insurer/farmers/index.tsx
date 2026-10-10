import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FarmerList } from "@/components/portal/FarmerList";
import { fetchFarmers, validateFarmerSearch } from "@/lib/farmers";

export const Route = createFileRoute("/insurer/farmers/")({
  validateSearch: validateFarmerSearch,
  loader: () => fetchFarmers(),
  head: () => ({ meta: [{ title: "Farmers | GonaInsured insurer portal" }] }),
  component: FarmersPage,
});

function FarmersPage() {
  const { status, q } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <FarmerList
      farmers={Route.useLoaderData()}
      portal="insurer"
      status={status}
      q={q}
      onSearch={(next) => navigate({ search: next, replace: true })}
      intro="Every covered farmer, their cover status and current growth stage."
    />
  );
}
