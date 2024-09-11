import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";
import NotFound from "@/pages/NotFound";

export const router = createRouter({
  routeTree,
  context: {
    // auth will initially be undefined
    // We'll be passing down the auth state from within a React component
    auth: undefined!,
  },
  defaultNotFoundComponent: NotFound,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
