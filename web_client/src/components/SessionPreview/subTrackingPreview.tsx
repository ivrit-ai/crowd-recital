import { useQuery } from "@tanstack/react-query";
import {
  ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { twJoin } from "tailwind-merge";

import { secondsToHourMinuteSecondString } from "@/utils";
import { getSessionPreviewOptions } from "@/client/queries/sessions";

type Props = {
  id: string;
  onClose: () => void;
};

type TextCueLocal = {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
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

  const audioRef = useRef<HTMLAudioElement>(null);
  const textTrackRef = useRef<TextTrack | null>(null);
  const activeCueTextRef = useRef<HTMLDivElement | null>(null);

  const [audioDataLoadedForId, setAudioDataLoadedForId] = useState("");
  useEffect(() => {
    // Reset - force the next preview to reprocess cues only
    // aftr data load C
    setAudioDataLoadedForId("");
  }, [id]);
  const loadedForCurrentId = audioDataLoadedForId == id;
  const [activeCueId, setActiveCueId] = useState("");
  const [textCues, setTextCues] = useState<TextCueLocal[] | null>(null);

  useEffect(() => {
    if (activeCueId) {
      activeCueTextRef.current?.scrollIntoView();
    }
  }, [activeCueId]);

  useEffect(() => {
    const cueChangeCb = () => {
      if (textTrackRef.current) {
        const cues = textTrackRef.current.activeCues;
        if (cues) setActiveCueId(cues[0]?.id);
      }
    };
    const currentPreviewId = id;
    const videoLoadedCb = () => {
      setAudioDataLoadedForId(currentPreviewId);
    };

    audioRef.current?.addEventListener("loadeddata", videoLoadedCb);
    if (!isPending && loadedForCurrentId) {
      if (audioRef.current) {
        textTrackRef.current = audioRef.current.textTracks[0];
        textTrackRef.current?.addEventListener("cuechange", cueChangeCb);
        if (textTrackRef.current?.cues) {
          [...textTrackRef.current.cues].forEach((cue, idx) => {
            const vttcue = cue as VTTCue;
            vttcue.id = `${idx}`;
          });

          setTextCues(
            [...textTrackRef.current.cues]
              .map((cue) => {
                const { id, text, startTime, endTime } = cue as VTTCue;
                return {
                  id,
                  text,

                  startTime,
                  endTime,
                };
              })
              .sort((c1, c2) => c1.endTime - c2.endTime),
          );
        }
      }
    }

    return () => {
      if (loadedForCurrentId) {
        audioRef.current?.removeEventListener("loadeddata", videoLoadedCb);
        textTrackRef.current?.removeEventListener("cuechange", cueChangeCb);
        textTrackRef.current = null;
      }
    };
  }, [id, isPending, loadedForCurrentId]);

  const nextCue = useCallback(
    (play: boolean) => {
      if (textCues?.length) {
        const currentCueIdx = textCues.findIndex((c) => c.id === activeCueId);
        const nextCue = textCues[currentCueIdx + 1];
        if (nextCue && audioRef.current) {
          audioRef.current.currentTime = nextCue.startTime + 0.001;
          if (play && audioRef.current.paused) {
            audioRef.current.play();
          }
        }
      }
    },
    [textCues, activeCueId],
  );
  const prevCue = useCallback(
    (play: boolean) => {
      if (textCues?.length) {
        const currentCueIdx = activeCueId
          ? textCues.findIndex((c) => c.id === activeCueId)
          : textCues.length;
        const prevCue = textCues[currentCueIdx - 1];
        if (prevCue && audioRef.current) {
          audioRef.current.currentTime = prevCue.startTime + 0.001;
          if (play && audioRef.current.paused) {
            audioRef.current.play();
          }
        }
      }
    },
    [textCues, activeCueId],
  );

  if (isError) {
    return <div>{t("same_clear_moth_fond")}</div>;
  }

  return (
    <dialog className="modal" ref={ref} onClose={onClose}>
      <div className="modal-box max-w-2xl">
        <h1 className="text-md pb-2 font-bold">
          {t("silly_moving_eagle_fold", { id })}
        </h1>
        <div className="max-h-60 overflow-y-auto">
          {textCues ? (
            <div className="flex flex-col justify-stretch gap-2">
              {textCues?.map((c) => (
                <div
                  className={twJoin(
                    "cursor-pointer border bg-base-200 p-2",
                    activeCueId === c.id &&
                      "border-2 border-primary font-bold text-primary",
                    c.endTime <= c.startTime && "hidden",
                  )}
                  key={c.id}
                  ref={c.id === activeCueId ? activeCueTextRef : null}
                  onClick={() => {
                    if (audioRef.current && c.endTime > c.startTime) {
                      audioRef.current.currentTime = c.startTime + 0.01;
                      if (audioRef.current.paused) {
                        audioRef.current.play();
                      }
                    }
                  }}
                >
                  <div className="text-sm">
                    {secondsToHourMinuteSecondString(c.startTime, false)}
                  </div>
                  <div className="w-full text-wrap py-2">{c.text}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-24 items-center justify-center text-center">
              <span className="loading loading-infinity loading-lg"></span>
            </div>
          )}
        </div>
        <div className="modal-action justify-center">
          <button className="btn btn-ghost" onClick={() => prevCue(true)}>
            {t("such_flat_koala_fall")}
          </button>
          <button className="btn btn-ghost" onClick={() => nextCue(true)}>
            {t("loose_funny_rooster_sail")}
          </button>
        </div>
        {!isPending && !playbackError ? (
          <audio
            ref={audioRef}
            className="w-full"
            controls
            crossOrigin="anonymous"
            autoPlay={false}
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
          </audio>
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
        <div dir="rtl" className="modal-action justify-center">
          <div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onClose()}
            >
              {t("full_merry_halibut_treat")}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default forwardRef(SessionPreview);
