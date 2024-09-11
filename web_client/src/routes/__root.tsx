import * as React from "react";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

import { AppRouterContext } from "@/context/appRouter";

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null // Render nothing in production
    : React.lazy(() =>
        // Lazy load in development
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
        })),
      );

export const Route = createRootRouteWithContext<AppRouterContext>()({
  component: () => (
    <React.Fragment>
      <Outlet />
      <React.Suspense>
        <TanStackRouterDevtools />
      </React.Suspense>
    </React.Fragment>
  ),
});
