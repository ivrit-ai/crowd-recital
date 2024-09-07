import { useQuery } from "@tanstack/react-query";
import { HeadphonesIcon } from "lucide-react";

import { RecitalSessionStatus } from "@/types/session";
import { getSessionOptions } from "@/client/queries/sessions";
import SessionPreview from "@/components/SessionPreview";
import useSessionPreview from "@/components/SessionPreview/useSessionPreview";

type Props = {
  id: string;
};

const SessionInfoBox = ({ id }: Props) => {
  const { data: sessionData, isPending } = useQuery({
    ...getSessionOptions(id),
    refetchInterval: !id
      ? false
      : (query) => {
          const lastFetchedData = query.state.data;
          if (lastFetchedData?.status !== RecitalSessionStatus.Uploaded) {
            return 1000;
          } else {
            return false;
          }
        },
  });
  const [
    sessionPreviewRef,
    previewedSessionId,
    setPreviewedSessionId,
    onClose,
  ] = useSessionPreview();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div>{id ? <span>הסתיים</span> : "ממתין להקלטה"}</div>
      {!isPending && (
        <>
          {sessionData &&
            sessionData.status !== RecitalSessionStatus.Uploaded && (
              <div className="btn btn-ghost btn-xs">
                <span className="loading loading-infinity" />
              </div>
            )}
          {sessionData?.status === RecitalSessionStatus.Uploaded && (
            <button
              className="btn btn-accent btn-xs"
              onClick={() => setPreviewedSessionId(id)}
            >
              <span>השמע</span> <HeadphonesIcon className="h-4 w-4" />
            </button>
          )}
        </>
      )}
      <SessionPreview
        ref={sessionPreviewRef}
        id={previewedSessionId}
        onClose={onClose}
      />
    </div>
  );
};

export default SessionInfoBox;
