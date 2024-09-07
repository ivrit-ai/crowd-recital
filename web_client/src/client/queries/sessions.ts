import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { SortConfiguration } from "../types/common";
import { RecitalSessionStatus } from "@/types/session";
import { getSessions, getSession, getSessionPreview } from "../sessions";

export function getSessionsOptions(
  page: number,
  itemsPerPage: number,
  status?: RecitalSessionStatus,
  sort?: SortConfiguration,
) {
  return queryOptions({
    queryKey: ["sessions", page, itemsPerPage, status, sort],
    queryFn: () => getSessions({ page, itemsPerPage, status, sort }),
    staleTime: 1000 * 30, // 30 seconds
    placeholderData: keepPreviousData,
  });
}

export function getSessionOptions(id: string) {
  return queryOptions({
    enabled: !!id,
    queryKey: ["session", id],
    queryFn: () => getSession({ id }),
    // No stale time - need the fresh one each time we refetch
  });
}

export function getSessionPreviewOptions(id: string) {
  return queryOptions({
    enabled: !!id,
    queryKey: ["sessionPreview", id],
    queryFn: () => getSessionPreview({ id }),
    staleTime: 1000 * 60 * 3, // 3 min
  });
}
