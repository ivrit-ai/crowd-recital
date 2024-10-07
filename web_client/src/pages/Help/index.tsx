import { Link, Navigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import ReactPlayer from "react-player/lazy";

import useTrackPageView from "@/analytics/useTrackPageView";
import { EnvConfig } from "@/config";

const embedId = EnvConfig.get("help_basic_guide_yt_video_id");

const Leaderboard = () => {
  const { t } = useTranslation();
  useTrackPageView("help");

  if (!embedId) {
    return <Navigate to="/" />;
  }

  return (
    <div className="hero min-h-screen-minus-topbar">
      <div className="hero-content mx-10 my-2 w-full max-w-2xl flex-col p-0">
        <h1 className="text-xl">{t("weird_misty_gecko_kick")}</h1>
        <div className="relative h-0 w-full overflow-hidden pt-[56.25%]">
          <ReactPlayer
            className="absolute left-0 top-0"
            url={`https://www.youtube.com/watch?v=${embedId}`}
            width="100%"
            height="100%"
            config={{
              youtube: {
                playerVars: { controls: 1, hl: "he" },
              },
            }}
          />
        </div>
        <Link className="btn btn-primary btn-sm mt-8" to="/documents">
          {t("sleek_last_platypus_engage")}
        </Link>
      </div>
    </div>
  );
};

export default Leaderboard;
