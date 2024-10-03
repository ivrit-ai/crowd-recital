import { useCallback } from "react";

import { createDocument, SourceType } from "@/client/documents";

export function useDocuments() {
  const createWikiArticleDocument = useCallback((articleUrl: string) => {
    return createDocument(articleUrl, SourceType.WikiArticle);
  }, []);
  const createFreeTextDocument = useCallback((text: string, title?: string) => {
    return createDocument(text, SourceType.PlainText, title);
  }, []);

  return { createWikiArticleDocument, createFreeTextDocument };
}
