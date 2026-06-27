import { createRootRoute, Outlet } from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import { AppLayout } from "@/components/layout/app-layout";

export const Route = createRootRoute({
  component: RootLayout,
});

export function RootLayout() {
  return (
    <AppLayout>
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </AppLayout>
  );
}
