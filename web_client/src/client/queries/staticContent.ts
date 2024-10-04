import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { loadEula } from "../staticContent";

export function getLoadEulaOptions(lang: string) {
  return queryOptions({
    queryKey: ["static.eula", lang],
    queryFn: () => loadEula(lang),
    placeholderData: keepPreviousData,
    staleTime: Infinity, // 30 sec - server side smart caching
  });
}
