import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { twJoin } from "tailwind-merge";

import { getMyUserStatsOptions } from "@/client/queries/stats";
import { RecitalSessionStatus } from "@/types/session";
import { secondsToHourMinuteSecondString } from "@/utils";

type HeaderUserStatsProps = {
  sessionId: string;
  sessionStatus?: string;
};

const HeaderUserStats = ({
  sessionId,
  sessionStatus,
}: HeaderUserStatsProps) => {
  const { t } = useTranslation("recordings");
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
      t("deft_mean_javelina_dazzle"),
    ],
    [
      myUserStats ? myUserStats.total_recordings : 0,
      t("royal_tame_eagle_walk"),
    ],
  ];
  if (myUserStats?.global_rank) {
    statsList.push([
      myUserStats.global_rank,
      t("mealy_ornate_firefox_inspire"),
    ]);
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
