import { createFileRoute } from "@tanstack/react-router";

import { getLeaderboardOptions } from "@/client/queries/stats";
import Leaderboard from "@/pages/Leaderboard";

export const Route = createFileRoute("/_main/leaderboard")({
  loader: async ({ context: { queryClient } }) => {
    return await queryClient.ensureQueryData(getLeaderboardOptions());
  },
  component: () => <Leaderboard />,
});
