import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { Document } from "@/models";
import { useDocuments } from "@/hooks/documents";
import RecitePage from "@/pages/Recite";

function Recite() {
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const { docId } = Route.useParams();
  // const docId2 = Route.useLoaderData();

  const { loadDocumentById } = useDocuments();

  useEffect(() => {
    loadDocumentById(docId).then((doc) => {
      setActiveDocument(Document.fromTextDocument(doc));
    });
  }, [docId]);

  if (!activeDocument) return null;

  return <RecitePage activeDocument={activeDocument} />;
}

export const Route = createFileRoute("/_main/recite/$docId")({
  loader: async ({ params }) => {
    return params.docId;
  },
  component: Recite,
});
