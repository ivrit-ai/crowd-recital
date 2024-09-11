import { createFileRoute } from "@tanstack/react-router";

import DocumentsPage from "@/pages/Documents";

export const Route = createFileRoute("/_main/documents")({
  component: DocumentsPage,
});
