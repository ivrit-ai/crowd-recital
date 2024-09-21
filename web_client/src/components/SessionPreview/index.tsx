import { useQuery } from "@tanstack/react-query";
import {
  ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { getSessionPreviewOptions } from "@/client/queries/sessions";

type Props = {
  id: string;
  onClose: () => void;
};

const SessionPreview = (
  { id, onClose }: Props,
  ref: ForwardedRef<HTMLDialogElement>,
) => {
  const { t } = useTranslation("recordings");
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
    return <div>{t("same_clear_moth_fond")}</div>;
  }

  return (
    <dialog className="modal" ref={ref} onClose={onClose}>
      <div className="modal-box">
        <h1 className="text-md">{t("silly_moving_eagle_fold", {id })}</h1>
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
              label={t("mild_white_tapir_lift")}
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
                {t("lazy_tasty_piranha_tear")}
              </div>
            ) : (
              <div className="loading loading-infinity loading-lg" />
            )}
          </div>
        )}
        <div className="modal-action justify-center">
          <button className="btn btn-primary btn-sm" onClick={() => onClose()}>
            {t("full_merry_halibut_treat")}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default forwardRef(SessionPreview);
