import { useTranslation } from "react-i18next";

import useTrackPageView from "@/analytics/useTrackPageView";
import CentredPage from "@/components/CenteredPage";

interface Props {
  userEmail: string;
}

const NotASpeaker = ({ userEmail }: Props) => {
  const { t } = useTranslation();
  useTrackPageView("notASpeaker");
  return (
    <CentredPage>
      <div className="hero">
        <div className="hero-content">
          <div className="text-center">
            <div className="text-5xl">🤷🏾‍♀️🤷‍♂️</div>
            <h1 className="text-4xl">{t("novel_born_jackal_heal")}</h1>
            <p className="pt-6">{t("cute_late_mayfly_lead")}</p>
            <p>{t("empty_front_worm_twirl")}</p>
            <p>({t("due_cute_gorilla_bump", { userEmail })})</p>
          </div>
        </div>
      </div>
    </CentredPage>
  );
};

export default NotASpeaker;
