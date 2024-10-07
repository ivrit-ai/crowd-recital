import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { getSystemTotalStatsOptions } from "@/client/queries/stats";
import { secondsToHourMinuteSecondString } from "@/utils";

const LeaderboardTable = () => {
  const { t } = useTranslation("recordings");

  const { data, isPending } = useQuery(getSystemTotalStatsOptions());

  return (
    <div dir="rtl">
      {isPending ? (
        <span className="loading loading-infinity loading-sm" />
      ) : (
        <div className="stats">
          <div className="stat">
            <span className="stat-title">{t("royal_tame_eagle_walk")}</span>
            <span className="stat-value">{data?.total_recordings || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-title">{t("deft_mean_javelina_dazzle")}</span>
            <span className="stat-value">
              {secondsToHourMinuteSecondString(
                data?.total_duration || 0,
                false,
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardTable;
