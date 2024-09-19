import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";

import useTrackPageView from "@/analytics/useTrackPageView";
import ivritAiLogo from "../../assets/ivrit_ai_logo.webp";
import { UserContext } from "@/context/user";
import { getMyUserStatsOptions } from "@/client/queries/stats";
import LeaderboardTable from "@/components/LeaderboardTable";
import { LeaderboardEntry } from "@/types/stats";

const Leaderboard = () => {
  useTrackPageView("leaderboard");
  const {
    auth: { user },
  } = useContext(UserContext);
  const { data: myUserStats, isPending: userStatsPending } = useQuery(
    getMyUserStatsOptions(),
  );

  let currentUserStatsEntry;

  if (!userStatsPending && myUserStats && user) {
    currentUserStatsEntry = {
      name: user.name,
      created_at: "",
      global_rank: myUserStats.global_rank,
      total_duration: myUserStats.total_duration,
      total_recordings: myUserStats.total_recordings,
    };
  }

  return (
    <div
      className="hero min-h-screen-minus-topbar"
      style={{
        backgroundImage:
          "radial-gradient(circle at center, white 0, grey 70%, white 100%)",
      }}
    >
      <div className="hero-content flex-col p-0">
        <aside className="w-48 overflow-clip rounded-xl">
          <img src={ivritAiLogo} alt="Ivrit.ai logo" />
        </aside>
        <div className="card w-full bg-base-100 text-center">
          <h1 className="my-4 text-2xl">אין עליהם</h1>
          <LeaderboardTable currentUserEntry={currentUserStatsEntry} />
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
