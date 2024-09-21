import { useTranslation } from "react-i18next";

import useTrackPageView from "@/analytics/useTrackPageView";
import HebrewSoup from "@/components/HebrewSoup/HebrewSoup";
import LeaderboardTable from "@/components/LeaderboardTable";
import ivritAiLogo from "../../assets/ivrit_ai_logo.webp";

const Leaderboard = () => {
  const { t } = useTranslation();
  useTrackPageView("leaderboard");

  return (
    <div className="hero min-h-screen-minus-topbar">
      <HebrewSoup />
      <div className="hero-content my-2 flex-col p-0">
        <aside className="w-24 overflow-clip rounded-xl opacity-70 sm:w-36">
          <img src={ivritAiLogo} alt="Ivrit.ai logo" />
        </aside>
        <div className="card mx-1 w-full bg-base-100 text-center opacity-85">
          <h1 className="my-4 text-2xl">{t("lazy_broad_guppy_cry")}</h1>
          <LeaderboardTable />
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
