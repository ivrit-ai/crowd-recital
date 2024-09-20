import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { twJoin } from "tailwind-merge";
import { RefreshCwIcon } from "lucide-react";

import { UserContext } from "@/context/user";
import { secondsToHourMinuteSecondString } from "@/utils";
import {
  getLeaderboardOptions,
  getMyUserStatsOptions,
} from "@/client/queries/stats";

const LeaderboardTable = () => {
  const {
    auth: { user },
  } = useContext(UserContext);
  const {
    data: myUserStats,
    isPending: userStatsPending,
    refetch: userStatsRefetch,
  } = useQuery(getMyUserStatsOptions());

  const data = useQuery(getLeaderboardOptions());
  const leaderboard = data.data;

  const doRefetch = () => {
    data.refetch();
    userStatsRefetch();
  };

  let currentUserEntry;
  if (!userStatsPending && myUserStats && user) {
    currentUserEntry = {
      name: user.name,
      created_at: "",
      global_rank: myUserStats.global_rank,
      total_duration: myUserStats.total_duration,
      total_recordings: myUserStats.total_recordings,
    };
  }

  const thisUserGlobalRank = currentUserEntry?.global_rank || 0;
  const leaderboardLength = leaderboard?.length || 0;
  const isOutOfTable = thisUserGlobalRank > leaderboardLength;
  const gapBelowTheTable =
    isOutOfTable && thisUserGlobalRank > leaderboardLength + 1;

  const userTableRow =
    currentUserEntry && isOutOfTable ? (
      <tr className="bg-base-300">
        <td>{thisUserGlobalRank}</td>
        <td>{currentUserEntry.name}</td>
        <td>
          {secondsToHourMinuteSecondString(
            currentUserEntry.total_duration || 0,
            false,
          )}
        </td>
        <td>{currentUserEntry?.total_recordings}</td>
        <td>
          <Link
            className="btn btn-outline btn-primary btn-xs text-xs sm:btn-sm sm:text-sm"
            to="/documents"
          >
            הקלט עוד!
          </Link>
        </td>
      </tr>
    ) : null;

  return (
    <div dir="rtl" className="overflow-x-scroll py-8">
      <table className="table table-sm table-auto sm:table-md">
        <thead>
          <tr>
            <th className="p-0">
              <button className="btn btn-sm" onClick={() => doRefetch()}>
                {data.isPending ? (
                  <span className="loading loading-infinity loading-sm" />
                ) : (
                  <RefreshCwIcon className="h-4 w-4" />
                )}
              </button>
            </th>
            <th>שם</th>
            <th>אורך כולל</th>
            <th>הקלטות</th>
            <th>הצטרף</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard?.map((ldre, idx) => (
            <tr
              key={idx}
              className={twJoin(
                thisUserGlobalRank === idx + 1 && "bg-base-300",
              )}
            >
              <td>{idx + 1}</td>
              <td>{ldre.name}</td>
              <td>
                {secondsToHourMinuteSecondString(
                  ldre.total_duration || 0,
                  false,
                )}
              </td>
              <td>{ldre.total_recordings}</td>
              <td dir="ltr">
                {new Date(ldre.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {gapBelowTheTable ? (
            <tr>
              <td colSpan={5} className="text-center text-xl">
                ...
              </td>
            </tr>
          ) : null}
          {userTableRow}
        </tbody>
      </table>
      {!isOutOfTable && (
        <div>
          <Link className="btn btn-primary btn-sm mt-2" to="/documents">
            מרשים! הקלט עוד...
          </Link>
        </div>
      )}
    </div>
  );
};

export default LeaderboardTable;