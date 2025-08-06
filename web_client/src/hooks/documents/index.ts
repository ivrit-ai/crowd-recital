import { useCallback } from "react";

import { createDocument, SourceType } from "@/client/documents";

export function useDocuments() {
  const createWikiArticleDocument = useCallback((articleUrl: string) => {
    return createDocument(articleUrl, SourceType.WikiArticle);
  }, []);
  const createFreeTextDocument = useCallback((text: string, title?: string, lang?: string) => {
    return createDocument(text, SourceType.PlainText, title, lang);
  }, []);

  return {
    createWikiArticleDocument,
    createFreeTextDocument,
  };
}
