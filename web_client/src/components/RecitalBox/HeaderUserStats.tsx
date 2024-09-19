import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { twJoin } from "tailwind-merge";

import { RecitalSessionStatus } from "@/types/session";
import { getMyUserStatsOptions } from "@/client/queries/stats";
import { secondsToHourMinuteSecondString } from "@/utils";

type HeaderUserStatsProps = {
  sessionId: string;
  sessionStatus?: string;
};

const HeaderUserStats = ({
  sessionId,
  sessionStatus,
}: HeaderUserStatsProps) => {
  const {
    data: myUserStats,
    isPending: userStatsPending,
    refetch: userStatsRefetch,
  } = useQuery(getMyUserStatsOptions());

  useEffect(() => {
    if (sessionId && sessionStatus === RecitalSessionStatus.Uploaded) {
      userStatsRefetch();
    }
  }, [sessionId, sessionStatus]);

  const statsList = [
    [
      myUserStats
        ? secondsToHourMinuteSecondString(myUserStats.total_duration, false)
        : "00:00",
      "סה״כ הוקלט",
    ],
    [myUserStats ? myUserStats.total_recordings : 0, "סה״כ הקלטות"],
  ];
  if (myUserStats?.global_rank) {
    statsList.push([myUserStats.global_rank, "דירוג"]);
  }

  return (
    <div className="flex justify-start sm:justify-center">
      <div className="flex gap-4 p-2 text-sm">
        {statsList.map((stat, idx) => (
          <div
            key={idx}
            className="border-0 border-b-4 border-s-2 border-accent px-2"
          >
            <div
              className={twJoin(
                "text-sm font-bold",
                userStatsPending && "skeleton",
              )}
            >
              {userStatsPending ? "--" : stat[0]}
            </div>
            <div className="text-xs">{stat[1]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeaderUserStats;
