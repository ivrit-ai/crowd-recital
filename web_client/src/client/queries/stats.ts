import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { getLeaderboard, getMyUserStats, getSystemTotalStats } from "../stats";

export function getLeaderboardOptions() {
  return queryOptions({
    queryKey: ["stats", "leaderboard"],
    queryFn: () => getLeaderboard(),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30 sec - server side smart caching
  });
}

export function getMyUserStatsOptions() {
  return queryOptions({
    queryKey: ["stats", "myuser"],
    queryFn: () => getMyUserStats(),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 10, // 10 min - Invalidate on demand
  });
}

export function getSystemTotalStatsOptions() {
  return queryOptions({
    queryKey: ["stats", "systemtotal"],
    queryFn: () => getSystemTotalStats(),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 10, // 10 min - Invalidate on demand
  });
}
