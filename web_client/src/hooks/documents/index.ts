import { useCallback } from "react";

import { reportResponseError } from "@/analytics";
import type { TextDocumentResponse } from "@/models";

const createDocumentUrl = "/api/create_document_from_source";
const loadDocumentsUrl = "/api/documents";

export enum SourceType {
  WikiArticle = "wiki-article",
}

const createDocument = async (source: string, sourceType: SourceType) => {
  const response = await fetch(`${createDocumentUrl}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source,
      source_type: sourceType,
    }),
  });
  if (!response.ok) {
    const errorMessage = await reportResponseError(
      response,
      "documents",
      "createDocument",
      "Failed to create document.",
    );

    throw new Error(errorMessage);
  }

  const documentInfo = await response.json();

  return {
    id: documentInfo.document_id,
    title: documentInfo.title,
  };
};

const loadDocument = async (documentId: string) => {
  const response = await fetch(`${loadDocumentsUrl}/${documentId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (!response.ok) {
    const errorMessage = await reportResponseError(
      response,
      "documents",
      "loadDocument",
      `Load Document ${documentId} Failed.`,
    );

    throw new Error(errorMessage);
  } else {
    const documentInfo: TextDocumentResponse = await response.json();
    return documentInfo;
  }
};

const loadDocuments = async () => {
  const response = await fetch(`${loadDocumentsUrl}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (!response.ok) {
    const errorMessage = await reportResponseError(
      response,
      "documents",
      "loadDocuments",
      "Load documents failed",
    );

    throw new Error(errorMessage);
  } else {
    const documentsInfo: TextDocumentResponse[] = await response.json();
    return documentsInfo;
  }
};

export function useDocuments() {
  const createWikiArticleDocument = useCallback((articleUrl: string) => {
    return createDocument(articleUrl, SourceType.WikiArticle);
  }, []);

  const loadDocumentById = useCallback((documentId: string) => {
    return loadDocument(documentId);
  }, []);

  const loadUserDocuments = useCallback(() => {
    return loadDocuments();
  }, []);

  return { createWikiArticleDocument, loadDocumentById, loadUserDocuments };
}
