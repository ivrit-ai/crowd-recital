export type LeaderboardEntry = {
  name: string;
  created_at: string;
  total_duration: number;
  total_recordings: number;
};

export type UserStatsType = {
  global_rank: number;
  total_duration: number;
  total_recordings: number;
};