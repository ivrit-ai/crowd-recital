import { Link, useMatch } from "@tanstack/react-router";
import { useLocalStorage } from "@uidotdev/usehooks";
import { XIcon } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const HeaderGuide = () => {
  const { t } = useTranslation();
  const [headerGuideState, setHeaderGuideState] = useLocalStorage(
    "header-guide-state",
    "initial",
  );
  const [headerGuideFirstSeen] = useLocalStorage(
    "header-guide-first-seen",
    Date.now(),
  );

  // If the help page has been seen - exit the guide
  const matchOnHelpPage = useMatch({ from: "/_main/help", shouldThrow: false });
  useEffect(() => {
    if (matchOnHelpPage) {
      setHeaderGuideState("exited");
    }
  }, [matchOnHelpPage]);

  const sinceFirstSeenMinutes = (Date.now() - headerGuideFirstSeen) / 1000 / 60;

  if (headerGuideState === "initial" && sinceFirstSeenMinutes < 5) {
    const onInteractedWithGuide = () => {
      setHeaderGuideState("exited");
    };
    return (
      <div className="p-2">
        <div className="alert grid-flow-col items-start">
          <span>
            {t("steep_broad_fly_trust")}
            <Link
              className="link px-4"
              to="/help"
              onClick={onInteractedWithGuide}
            >
              {t("curly_any_salmon_dash")}
            </Link>
          </span>
          <div
            className="btn btn-ghost btn-xs justify-self-end"
            onClick={onInteractedWithGuide}
          >
            <XIcon />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default HeaderGuide;
