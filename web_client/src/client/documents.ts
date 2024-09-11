import { APIError, APINotFoundError } from "./types/common";
import { reportResponseError } from "@/analytics";
import { TextDocumentResponse, Document } from "@/models";

const createDocumentUrl = "/api/create_document_from_source";
const loadDocumentsUrl = "/api/documents";

export enum SourceType {
  WikiArticle = "wiki-article",
}

export const createDocument = async (
  source: string,
  sourceType: SourceType,
) => {
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

export const loadTextDocument = async (documentId: string) => {
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

    let error = new APIError(errorMessage, response.status);
    if (response.status === 404) {
      error = new APINotFoundError(errorMessage);
    }
    throw error;
  } else {
    const documentInfo: TextDocumentResponse = await response.json();
    return documentInfo;
  }
};

export const getDocument = async (documentId: string) => {
  const textDoc = await loadTextDocument(documentId);
  return Document.fromTextDocument(textDoc);
};

export const loadDocuments = async () => {
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
