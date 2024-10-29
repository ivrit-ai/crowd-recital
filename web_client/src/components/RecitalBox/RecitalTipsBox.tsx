import { Link } from "@tanstack/react-router";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useTranslation } from "react-i18next";

type ShowButtonProps = {
  children: React.ReactNode;
};

enum RecitalGuideState {
  Initial = "initial",
  Reshow = "reshow",
  Hidden = "hidden",
}

const useGuideState = () =>
  useLocalStorage<RecitalGuideState>(
    "recital-guide-state",
    RecitalGuideState.Initial,
  );

export const RecitalTipxBoxShowButton = ({ children }: ShowButtonProps) => {
  const [, setRecitalGuideState] = useGuideState();

  return (
    <button onClick={setRecitalGuideState.bind(null, RecitalGuideState.Reshow)}>
      {children}
    </button>
  );
};

const RecitalTipsBox = () => {
  const { t } = useTranslation();
  const [recitalGuideState, setRecitalGuideState] = useGuideState();

  const autoShowOn = recitalGuideState === RecitalGuideState.Initial;
  const reshow = recitalGuideState === RecitalGuideState.Reshow;
  if (!autoShowOn && !reshow) return null;
  const onDismiss = () => setRecitalGuideState(RecitalGuideState.Hidden);

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h1 className="mb-2 text-lg text-primary">
          {reshow ? t("lucky_this_sheep_fall") : t("level_large_cobra_foster")}
        </h1>
        <ul className="list-inside list-disc *:mb-2">
          <li>{t("knotty_main_worm_enchant")}</li>
          <li>{t("aloof_slow_iguana_pat")}</li>
          <li>{t("kind_zany_meerkat_fond")}</li>
          <li>{t("civil_cool_hound_work")}</li>
          <li>{t("novel_weak_kitten_reap")}</li>
          <li className="nokbd:hidden">{t("dizzy_trite_panther_sing")}</li>
          <li className="hidden nokbd:list-item">
            {t("acidic_short_skate_type")}
          </li>
        </ul>
        {!reshow && (
          <p className="mt-4 text-lg">
            {t("misty_nice_skunk_nail")}{" "}
            <Link className="link" to="/help" onClick={onDismiss}>
              {t("light_tired_orangutan_stir")}
            </Link>
          </p>
        )}
        <div className="modal-action">
          <button className="btn btn-primary" onClick={onDismiss}>
            {t("bald_gross_panda_evoke")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecitalTipsBox;
