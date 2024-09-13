import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { SortConfiguration } from "../types/common";
import { getDocument, loadDocuments } from "../documents";

export function getDocumentsOptions(
  page: number,
  itemsPerPage: number,
  sort?: SortConfiguration,
  owner?: string,
) {
  return queryOptions({
    queryKey: ["documents", page, itemsPerPage, owner, sort],
    queryFn: () => loadDocuments({ page, itemsPerPage, owner, sort }),
    staleTime: 1000 * 60 * 10, // 10 minutes
    placeholderData: keepPreviousData,
  });
}

export function getDocumentOptions(id: string) {
  return queryOptions({
    queryKey: ["document", id],
    queryFn: () => getDocument(id),
    staleTime: 1000 * 60 * 10, // 10 minutes
    placeholderData: keepPreviousData,
    // This atm the document structure returned is optimized
    // for reciting - it has internal links and cycles.
    // Consider moving this to an on-page memo
    structuralSharing: false,
  });
}
