import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { requireRole } from "@/lib/auth";

// Cooperative staff; row-level security limits them to their own cooperative's farmers.
export const Route = createFileRoute("/cooperative")({
  beforeLoad: async ({ context, location }) => ({
    auth: await requireRole(context.queryClient, location.href, ["cooperative"]),
  }),
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: CooperativeLayout,
});

function CooperativeLayout() {
  const { auth } = Route.useRouteContext();
  return (
    <PortalShell auth={auth} portal="cooperative">
      <Outlet />
    </PortalShell>
  );
}
