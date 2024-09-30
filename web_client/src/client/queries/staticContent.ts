import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { loadEula } from "../staticContent";

export function getLoadEulaOptions() {
  return queryOptions({
    queryKey: ["static.eula"],
    queryFn: () => loadEula(),
    placeholderData: keepPreviousData,
    staleTime: Infinity, // 30 sec - server side smart caching
  });
}
