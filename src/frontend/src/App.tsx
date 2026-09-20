import { Layout } from "@/components/Layout";
import { ReportDetailPage } from "@/pages/ReportDetailPage";
import { ReportListPage } from "@/pages/ReportListPage";
import { ReportNewPage } from "@/pages/ReportNewPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const listRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ReportListPage,
});

const newReportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/laporan/baru",
  component: ReportNewPage,
});

const detailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/laporan/$reportId",
  component: ReportDetailPage,
});

const routeTree = rootRoute.addChildren([
  listRoute,
  newReportRoute,
  detailRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
