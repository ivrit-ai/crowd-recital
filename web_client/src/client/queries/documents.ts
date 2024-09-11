import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { getDocument } from "../documents";

export function getDocumentOptions(id: string) {
  return queryOptions({
    queryKey: ["document", id],
    queryFn: () => getDocument(id),
    staleTime: 1000 * 60 * 10, // 10 minutes
    placeholderData: keepPreviousData,
  });
}
