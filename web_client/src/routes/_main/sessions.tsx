import { createFileRoute } from "@tanstack/react-router";

import SessionsPage from "@/pages/Sessions";

export const Route = createFileRoute("/_main/sessions")({
  component: SessionsPage,
});
