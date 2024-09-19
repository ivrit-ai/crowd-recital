import useTrackPageView from "@/analytics/useTrackPageView";
import ivritAiLogo from "../../assets/ivrit_ai_logo.webp";
import LeaderboardTable from "@/components/LeaderboardTable";

const Leaderboard = () => {
  useTrackPageView("leaderboard");

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
          <LeaderboardTable />
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
