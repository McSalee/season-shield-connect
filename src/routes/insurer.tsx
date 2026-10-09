import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { requireRole } from "@/lib/auth";

// Insurers, plus GonaInsured admins looking at the insurer view (read-only).
export const Route = createFileRoute("/insurer")({
  beforeLoad: async ({ context, location }) => ({
    auth: await requireRole(context.queryClient, location.href, ["insurer", "admin"]),
  }),
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: InsurerLayout,
});

function InsurerLayout() {
  const { auth } = Route.useRouteContext();
  return (
    <PortalShell auth={auth} portal="insurer">
      <Outlet />
    </PortalShell>
  );
}
