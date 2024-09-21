import { useTranslation } from "react-i18next";
import { twJoin } from "tailwind-merge";

import { RecitalSessionStatus } from "@/types/session";

type StatusDisplay = {
  label: string;
  progress: boolean;
  className: string;
};

function useSessionStatusDisplay(
  status: RecitalSessionStatus,
  disavowed: boolean,
): StatusDisplay {
  const { t } = useTranslation("recordings");
  if (disavowed) {
    switch (status) {
      case RecitalSessionStatus.Discarded:
        return {
          label: t("quick_front_thrush_cut"),
          progress: false,
          className: "badge-neutral",
        };
      default:
        return {
          label: t("strong_alive_cow_fall"),
          progress: true,
          className: "badge-error",
        };
    }
  } else {
    switch (status) {
      case RecitalSessionStatus.Active:
      case RecitalSessionStatus.Ended:
      case RecitalSessionStatus.Aggregated:
        return {
          label: t("tired_true_dove_tear"),
          progress: true,
          className: "badge-warning",
        };
      case RecitalSessionStatus.Uploaded:
        return {
          label: t("candid_away_starfish_aspire"),
          progress: false,
          className: "badge-success",
        };
      case RecitalSessionStatus.Discarded:
        return {
          label: t("arable_dirty_tern_grin"),
          progress: false,
          className: "badge-neutral",
        };
      default:
        return {
          label: t("arable_cute_seal_enrich"),
          progress: false,
          className: "badge-error",
        };
    }
  }
}

function StatusDisplay({
  status,
  disavowed,
}: {
  status: RecitalSessionStatus;
  disavowed: boolean;
}) {
  const { label, progress, className } = useSessionStatusDisplay(
    status as RecitalSessionStatus,
    disavowed,
  );
  return (
    <div className={twJoin("badge badge-sm sm:badge-lg", className)}>
      {label}
      {progress && <div className="loading loading-infinity loading-xs mx-1" />}
    </div>
  );
}

export default StatusDisplay;
