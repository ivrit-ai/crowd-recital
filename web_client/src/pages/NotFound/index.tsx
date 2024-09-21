import { useTranslation } from "react-i18next";

import useTrackPageView from "@/analytics/useTrackPageView";
import CentredPage from "@/components/CenteredPage";

const NotASpeaker = () => {
  const { t } = useTranslation();
  useTrackPageView("notFound");
  return (
    <CentredPage>
      <div className="hero">
        <div className="hero-content">
          <div className="text-center">
            <div className="text-5xl">🫣😳</div>
            <h1 className="text-4xl">{t("careful_great_turkey_dine")}</h1>
            <p className="pt-6">
              {t("tough_royal_swallow_treasure")}
            </p>
            <p>{t("sound_tidy_opossum_learn")}</p>
          </div>
        </div>
      </div>
    </CentredPage>
  );
};

export default NotASpeaker;
