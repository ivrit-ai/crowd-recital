import {
  ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useState,
} from "react";
import { getSessionPreviewOptions } from "@/client/queries/sessions";
import { useQuery } from "@tanstack/react-query";

type Props = {
  id: string;
  onClose: () => void;
};

const SessionPreview = (
  { id, onClose }: Props,
  ref: ForwardedRef<HTMLDialogElement>,
) => {
  const {
    data: sessionPreviewData,
    isPending,
    isError,
  } = useQuery(getSessionPreviewOptions(id));
  useEffect(() => {
    setPlaybackError(false);
  }, [id]);
  const [playbackError, setPlaybackError] = useState(false);
  const onPlaybackError = useCallback(() => {
    setPlaybackError(true);
  }, []);

  if (isError) {
    return <div>ארעה שגיאה בהצגת הסשן</div>;
  }

  return (
    <dialog className="modal" ref={ref} onClose={onClose}>
      <div className="modal-box">
        <h1 className="text-md">השמעת הקלטה - {id}</h1>
        {!isPending && !playbackError ? (
          <video
            className="medium-captions my-4 h-[300px] w-[40rem] max-w-full border border-solid"
            controls
            crossOrigin="anonymous"
            autoPlay
          >
            <source
              type="audio/mp3"
              src={sessionPreviewData!.audio_url}
              onError={onPlaybackError}
            />
            <track
              label="כתוביות"
              kind="subtitles"
              srcLang="he"
              src={sessionPreviewData!.transcript_url}
              default
            />
          </video>
        ) : (
          <div className="flex min-h-[250px] w-full items-center justify-center">
            {playbackError && !isPending ? (
              <div className="alert alert-warning text-center text-lg">
                ישנה בעיה בהשמעת ההקלטה
              </div>
            ) : (
              <div className="loading loading-infinity loading-lg" />
            )}
          </div>
        )}
        <div className="modal-action justify-center">
          <button className="btn btn-primary btn-sm" onClick={() => onClose()}>
            סגור
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default forwardRef(SessionPreview);
