import { createFileRoute, notFound } from "@tanstack/react-router";

import { APINotFoundError } from "@/client/types/common";
import { getDocumentOptions } from "@/client/queries/documents";
import RecitePage from "@/pages/Recite";
import { useQuery } from "@tanstack/react-query";

function Recite() {
  const docId = Route.useParams().docId;
  const { data: document } = useQuery(getDocumentOptions(docId));

  if (!document) return null;

  return <RecitePage document={document} />;
}

export const Route = createFileRoute("/_main/recite/$docId")({
  loader: async ({ context: { queryClient }, params }) => {
    try {
      return await queryClient.ensureQueryData(
        getDocumentOptions(params.docId),
      );
    } catch (error) {
      if (error instanceof APINotFoundError) {
        throw notFound();
      }
    }
  },
  component: Recite,
});
