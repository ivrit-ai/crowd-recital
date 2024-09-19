import { HeadphonesIcon } from "lucide-react";

import { secondsToHourMinuteSecondString } from "@/utils";
import { RecitalSessionStatus, RecitalSessionType } from "@/types/session";
import SessionPreview from "@/components/SessionPreview";
import useSessionPreview from "@/components/SessionPreview/useSessionPreview";

type Props = {
  id: string;
  sessionData?: RecitalSessionType;
  isPending: boolean;
};

const SessionInfoBox = ({ id, sessionData, isPending }: Props) => {
  const [
    sessionPreviewRef,
    previewedSessionId,
    setPreviewedSessionId,
    onClose,
  ] = useSessionPreview();

  let statusElement = null;
  if (sessionData?.disavowed) {
    statusElement = (
      <div className="btn btn-ghost btn-xs">
        <span>נמחק</span>
      </div>
    );
  } else if (sessionData?.status === RecitalSessionStatus.Uploaded) {
    statusElement = (
      <button
        className="btn btn-accent btn-xs"
        onClick={() => setPreviewedSessionId(id)}
      >
        <span>השמע</span>{" "}
        <span>
          {secondsToHourMinuteSecondString(sessionData.duration || 0, false)}
        </span>
        <HeadphonesIcon className="h-4 w-4" />
      </button>
    );
  } else if (sessionData) {
    statusElement = (
      <div className="btn btn-ghost btn-xs">
        <span className="loading loading-infinity" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div>{id ? <span>הסתיים</span> : "ממתין להקלטה"}</div>
      {!isPending && statusElement}
      <SessionPreview
        ref={sessionPreviewRef}
        id={previewedSessionId}
        onClose={onClose}
      />
    </div>
  );
};

export default SessionInfoBox;
