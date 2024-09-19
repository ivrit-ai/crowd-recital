import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { getLeaderboard } from "../stats";

export function getLeaderboardOptions() {
  return queryOptions({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard(),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30 sec - server side smart caching
  });
}
