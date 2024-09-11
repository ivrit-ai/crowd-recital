import { useCallback } from "react";

import { createDocument, loadDocuments, SourceType } from "@/client/documents";

export function useDocuments() {
  const createWikiArticleDocument = useCallback((articleUrl: string) => {
    return createDocument(articleUrl, SourceType.WikiArticle);
  }, []);

  const loadUserDocuments = useCallback(() => {
    return loadDocuments();
  }, []);

  return { createWikiArticleDocument, loadUserDocuments };
}
