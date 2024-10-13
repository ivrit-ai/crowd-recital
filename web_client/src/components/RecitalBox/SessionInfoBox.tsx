import { HeadphonesIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import SubTrackingSessionPreview from "@/components/SessionPreview/subTrackingPreview";
import useSessionPreview from "@/components/SessionPreview/useSessionPreview";
import { RecitalSessionStatus, RecitalSessionType } from "@/types/session";
import { secondsToHourMinuteSecondString } from "@/utils";

type Props = {
  id: string;
  sessionData?: RecitalSessionType;
  isPending: boolean;
};

const SessionInfoBox = ({ id, sessionData, isPending }: Props) => {
  const { t } = useTranslation("recordings");
  const [
    sessionPreviewRef,
    previewedSessionId,
    setPreviewedSessionId,
    onClose,
  ] = useSessionPreview();

  let statusElement = null;
  const loadingStatusElement = (
    <div className="btn btn-ghost btn-xs">
      <span className="loading loading-infinity" />
    </div>
  );
  if (sessionData?.disavowed) {
    statusElement = (
      <div className="btn btn-ghost btn-xs">
        <span>{t("sound_nimble_spider_burn")}</span>
      </div>
    );
  } else if (sessionData?.status === RecitalSessionStatus.Uploaded) {
    statusElement = (
      <button
        className="btn btn-accent btn-xs"
        onClick={() => setPreviewedSessionId(id)}
      >
        <span>{t("small_moving_raven_buy")}</span>{" "}
        <span>
          {secondsToHourMinuteSecondString(sessionData.duration || 0, false)}
        </span>
        <HeadphonesIcon className="h-4 w-4" />
      </button>
    );
  } else if (sessionData) {
    statusElement = loadingStatusElement;
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
      <div>{!id && t("fun_cute_mayfly_earn")}</div>
      {isPending ? loadingStatusElement : statusElement}
      <SubTrackingSessionPreview
        ref={sessionPreviewRef}
        id={previewedSessionId}
        onClose={onClose}
      />
    </div>
  );
};

export default SessionInfoBox;
