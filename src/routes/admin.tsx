import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { requireRole } from "@/lib/auth";

// GonaInsured staff only.
export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ context, location }) => ({
    auth: await requireRole(context.queryClient, location.href, ["admin"]),
  }),
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { auth } = Route.useRouteContext();
  return (
    <PortalShell auth={auth} portal="admin">
      <Outlet />
    </PortalShell>
  );
}
