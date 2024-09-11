import { createFileRoute, redirect } from "@tanstack/react-router";

// No HOME for this app atm
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    return redirect({
      to: "/docs",
    });
  },
  component: () => null,
});
