import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { getUserProfile } from "../user";

export function getUserProfileOptions() {
  return queryOptions({
    queryKey: ["userProfile"],
    queryFn: () => getUserProfile(),
    placeholderData: keepPreviousData,
    staleTime: Infinity, // Will only become stale when updated from the client side (for now)
  });
}
