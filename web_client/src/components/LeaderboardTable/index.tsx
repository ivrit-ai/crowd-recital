import { useQuery } from "@tanstack/react-query";

import { secondsToMinuteSecondMillisecondString } from "@/utils";
import { getLeaderboardOptions } from "@/client/queries/stats";

const LeaderboardTable = () => {
  const data = useQuery(getLeaderboardOptions());
  const leaderboard = data.data;

  return (
    <div dir="rtl" className="overflow-x-scroll">
      <table className="table table-auto">
        <thead>
          <tr>
            <th></th>
            <th>שם</th>
            <th>הצטרף</th>
            <th>אורך כולל</th>
            <th>מס׳ הקלטות</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard?.map((ldre, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>{ldre.name}</td>
              <td>{new Date(ldre.created_at).toLocaleString()}</td>
              <td>
                {secondsToMinuteSecondMillisecondString(
                  ldre.total_duration || 0,
                  false,
                )}
              </td>
              <td>{ldre.total_recordings}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
