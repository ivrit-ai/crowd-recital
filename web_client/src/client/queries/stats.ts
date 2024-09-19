import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { getLeaderboard, getMyUserStats } from "../stats";

export function getLeaderboardOptions() {
  return queryOptions({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard(),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30 sec - server side smart caching
  });
}

export function getMyUserStatsOptions() {
  return queryOptions({
    queryKey: ["myuserstats"],
    queryFn: () => getMyUserStats(),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 10, // 10 min - Invalidate on demand
  });
}
