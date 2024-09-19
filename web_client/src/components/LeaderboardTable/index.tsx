import { useQuery } from "@tanstack/react-query";

import { Link } from "@tanstack/react-router";
import { secondsToMinuteSecondMillisecondString } from "@/utils";
import { getLeaderboardOptions } from "@/client/queries/stats";
import { LeaderboardEntry } from "@/types/stats";
import { twJoin } from "tailwind-merge";

type CurrentUserLeaderboardEntry = {
  global_rank: number;
} & LeaderboardEntry;

type Props = {
  currentUserEntry?: CurrentUserLeaderboardEntry;
};

const LeaderboardTable = ({ currentUserEntry }: Props) => {
  const data = useQuery(getLeaderboardOptions());
  const leaderboard = data.data;

  const thisUserGlobalRank = currentUserEntry?.global_rank || 0;
  const leaderboardLength = leaderboard?.length || 0;
  const isOutOfTable = thisUserGlobalRank > leaderboardLength;
  const gapBelowTheTable =
    isOutOfTable && thisUserGlobalRank > leaderboardLength + 1;

  const userTableRow =
    currentUserEntry && isOutOfTable ? (
      <tr>
        <td>{thisUserGlobalRank}</td>
        <td>{currentUserEntry.name}</td>
        <td>
          {secondsToMinuteSecondMillisecondString(
            currentUserEntry.total_duration || 0,
            false,
          )}
        </td>
        <td>{currentUserEntry?.total_recordings}</td>
        <td>
          <Link
            className="btn-outline btn-primary btn-sm text-xs sm:text-sm"
            to="/documents"
          >
            <span>הקלט</span>
            <span className="hidden sm:inline"> וטפס מעלה</span>
            <span>!</span>
          </Link>
        </td>
      </tr>
    ) : null;

  return (
    <div dir="rtl" className="overflow-x-scroll">
      <table className="table table-auto">
        <thead>
          <tr>
            <th></th>
            <th>שם</th>
            <th>אורך כולל</th>
            <th>מס׳ הקלטות</th>
            <th>הצטרף</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard?.map((ldre, idx) => (
            <tr
              key={idx}
              className={twJoin(
                thisUserGlobalRank === idx + 1 && "text-primary",
              )}
            >
              <td>{idx + 1}</td>
              <td>{ldre.name}</td>
              <td>
                {secondsToMinuteSecondMillisecondString(
                  ldre.total_duration || 0,
                  false,
                )}
              </td>
              <td>{ldre.total_recordings}</td>
              <td dir="ltr">{new Date(ldre.created_at).toLocaleString()}</td>
            </tr>
          ))}
          {gapBelowTheTable ? (
            <tr>
              <td colSpan={4} className="text-center text-xl">
                ...
              </td>
            </tr>
          ) : null}
          {userTableRow}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
