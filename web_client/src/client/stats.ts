import { reportResponseError } from "@/analytics";
import type { LeaderboardEntry } from "@/types/stats";

const statsBaseUrl = "/api/stats";

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await fetch(`${statsBaseUrl}/leaderboard`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = await reportResponseError(
      response,
      "stats",
      "getLeaderboard",
      "Failed to get leaderboard",
    );
    throw new Error(errorMessage);
  }

  return response.json();
}
