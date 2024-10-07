import type {
  PagedResponse,
  PagingParams,
  SortConfigurationParams,
} from "./types/common";
import { APIError, APINotFoundError } from "./types/common";
import { reportResponseError } from "@/analytics";
import { TextDocumentResponse, Document } from "@/models";
import { setSortAndPagingQueryParams } from "@/client/common";

const documentsApiBase = "/api/documents";

export enum SourceType {
  WikiArticle = "wiki-article",
  PlainText = "plain-text",
}

export const createDocument = async (
  source: string,
  sourceType: SourceType,
  title?: string,
) => {
  const response = await fetch(`${documentsApiBase}/from_source`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source,
      source_type: sourceType,
      title,
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
  const response = await fetch(`${documentsApiBase}/${documentId}`, {
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

export type DocumentFilters = {
  owner?: string;
  includePublic?: boolean;
};

export type LoadDocumentsQueryParams = PagingParams &
  DocumentFilters &
  SortConfigurationParams;

type TextDocumentsResponse = PagedResponse<TextDocumentResponse>;

export async function loadDocuments(
  queryParams: LoadDocumentsQueryParams,
): Promise<TextDocumentsResponse> {
  const requestQueryParams = new URLSearchParams();
  if (queryParams.owner) {
    requestQueryParams.append("owner_id", queryParams.owner);
  }
  if (queryParams.includePublic) {
    requestQueryParams.append("include_public", "1");
  }
  setSortAndPagingQueryParams(queryParams, requestQueryParams);

  const searchQuery = requestQueryParams
    ? `?${requestQueryParams.toString()}`
    : "";

  const response = await fetch(`${documentsApiBase}${searchQuery}`, {
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
    return response.json();
  }
}
