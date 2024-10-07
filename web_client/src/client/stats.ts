import { reportResponseError } from "@/analytics";
import type {
  LeaderboardEntry,
  SystemTotalStatsType,
  UserStatsType,
} from "@/types/stats";

const statsBaseUrl = "/api/stats";

export async function getMyUserStats(): Promise<UserStatsType> {
  const response = await fetch(`${statsBaseUrl}/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = await reportResponseError(
      response,
      "stats",
      "getMyUserStats",
      "Failed to get my user stats",
    );
    throw new Error(errorMessage);
  }

  return response.json();
}

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

export async function getSystemTotalStats(): Promise<SystemTotalStatsType> {
  const response = await fetch(`${statsBaseUrl}/totals`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = await reportResponseError(
      response,
      "stats",
      "getMyUserStats",
      "Failed to get my user stats",
    );
    throw new Error(errorMessage);
  }

  return response.json();
}
