import { useCallback } from "react";

import { createDocument, SourceType } from "@/client/documents";

export function useDocuments() {
  const createWikiArticleDocument = useCallback((articleUrl: string) => {
    return createDocument(articleUrl, SourceType.WikiArticle);
  }, []);

  return { createWikiArticleDocument };
}
