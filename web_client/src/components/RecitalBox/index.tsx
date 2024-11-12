import { useVisibilityChange } from "@uidotdev/usehooks";
import { InfoIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { twJoin } from "tailwind-merge";

import { EnvConfig } from "@/env/config";
import { useRecordingUploader } from "@/hooks/recodingUploader";
import { useTextSegmentUploader } from "@/hooks/textSegmentUploader";
import { useRecordingSession } from "@/hooks/useRecordingSession";
import { Document } from "@/models";
import { secondsToHourMinuteSecondString } from "@/utils";
import Header from "./Header";
import RecitalTipsBox from "./RecitalTipsBox";
import SessionFinalizeModal from "./SessionFinalizeModal";
import useControlCallback from "./useControlCallback";
import useDocumentNavigation, {
  NavigationControls,
} from "./useDocumentNavigation";
import useKeyboardControl from "./useKeyboardControl";

const useAutoSessionStop = (
  recording: boolean,
  finalizeSession: () => Promise<void>,
  audioUploaderError: Error | null,
  textUploaderError: Error | null,
) => {
  const { t } = useTranslation("recordings");
  const finalizeSessionCbRef = useRef(finalizeSession); // Latest ref trick
  useLayoutEffect(() => {
    finalizeSessionCbRef.current = finalizeSession;
  });
  const [autoStopReason, setAutoStopReason] =
    useState<React.ReactElement | null>(null);
  const documentVisible = useVisibilityChange();
  useEffect(() => {
    if (recording) {
      let autoStoppedForReason = null;
      if (audioUploaderError || textUploaderError) {
        autoStoppedForReason = (
          <div>
            <div>{t("trite_yummy_martin_aspire")}</div>
            <div>{t("these_active_leopard_engage")}</div>
            <div>{t("close_equal_dragonfly_work")}</div>
          </div>
        );
      } else if (!documentVisible) {
        autoStoppedForReason = (
          <div>
            <div>{t("trite_yummy_martin_aspire")}</div>
            <div>{t("these_active_leopard_engage")}</div>
            <div>{t("close_equal_dragonfly_work")}</div>
          </div>
        );
      }

      if (autoStoppedForReason) {
        finalizeSessionCbRef.current();
        setAutoStopReason(autoStoppedForReason);
      }
    }
  }, [recording, audioUploaderError, textUploaderError, documentVisible]);

  return { autoStopReason };
};

type RecitalBoxProps = {
  document: Document;
};

const RecitalBox = ({ document }: RecitalBoxProps) => {
  const { t } = useTranslation("recordings");
  const [sessionStartError, setSessionStartError] = useState<Error | null>(
    null,
  );
  const [sessionId, setSessionId] = useState<string>("");
  const { activeParagraphIndex, activeSentenceIndex, activeSentence, move } =
    useDocumentNavigation(document);
  const activeSentenceElementRef = useRef<HTMLSpanElement>(null);

  const [createNewSession, endSession] = useRecordingSession(document?.id);
  const endSessionAndMoveOn = useCallback(
    (sessionId: string, discardLastNTextSegments: number) => {
      endSession(sessionId, discardLastNTextSegments).then(() => {
        if (discardLastNTextSegments === 0) {
          move.nextSentence();
        } else {
          // TODO - when we support discarding more than one sentence:
          // Staying put is not enough - we actually need to wind back n - 1
          // sentences to start next recording at the missing text.
        }
      });
    },
    [endSession, move],
  );
  const {
    ready,
    uploaderError: audioUploaderError,
    recording,
    recordingTimestamp,
    startRecording,
    stopRecording,
  } = useRecordingUploader(
    EnvConfig.getInteger("audio_segment_upload_length_seconds"),
  );
  const {
    uploadTextSegment,
    uploaderError: textUploaderError,
    clearUploaderError: clearTextUploaderError,
  } = useTextSegmentUploader(sessionId, recordingTimestamp);

  const uploadActiveSentence = useCallback(async () => {
    await uploadTextSegment(activeSentence.text).then(() => {
      if (import.meta.env.DEV) {
        console.log("Uploaded Text Segment!");
      }
    });
  }, [activeSentence, uploadTextSegment]);

  const [awaitingSessionFinalization, setAwaitingSessionFinalization] =
    useState(false);
  const [readyToFinalize, setReadyToFinalize] = useState(false);
  useState(false);
  const finalizeSession = useCallback(async () => {
    setReadyToFinalize(false);
    setAwaitingSessionFinalization(true);
    await stopRecording();
    await uploadActiveSentence();
    setReadyToFinalize(true);
  }, [stopRecording, uploadActiveSentence, sessionId]);

  const onControl = useControlCallback(
    move,
    recording,
    createNewSession,
    finalizeSession,
    setSessionId,
    startRecording,
    uploadActiveSentence,
    setSessionStartError,
    clearTextUploaderError,
  );

  useKeyboardControl(onControl, !awaitingSessionFinalization);

  useEffect(() => {
    activeSentenceElementRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeParagraphIndex, activeSentenceIndex]);

  const { autoStopReason } = useAutoSessionStop(
    recording,
    finalizeSession,
    audioUploaderError,
    textUploaderError,
    // TODO: Add signal "speech input present"
    // TODO: Add signal "last sentence sent at"
  );

  return (
    <div>
      <div className="sticky top-topbar">
        <Header
          sessionId={sessionId}
          recording={recording}
          document={document}
        />

        {autoStopReason ? (
          <div className="alert alert-error mx-auto max-w-2xl">
            <InfoIcon className="h-8 w-8 flex-shrink-0" />
            {autoStopReason}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4 bg-base-200 py-2 nokbd:hidden">
            <span>
              <kbd className="kbd kbd-sm">⏎</kbd>{" "}
              {recording
                ? t("bold_weird_okapi_win")
                : t("odd_next_gazelle_transform")}
            </span>
            {!recording && (
              <span>
                <kbd className="kbd kbd-sm">&uarr;</kbd>{" "}
                {t("ornate_quiet_turtle_hurl")}
              </span>
            )}
            {!recording && (
              <span>
                <kbd className="kbd kbd-sm">&darr;</kbd>{" "}
                {t("weird_moving_mongoose_cry")}
              </span>
            )}
            <span>
              <kbd className="kbd kbd-sm">&larr;</kbd>{" "}
              {t("zippy_safe_halibut_spur")}
            </span>
            <span>
              <kbd className="kbd kbd-sm">&rarr;</kbd>{" "}
              {t("loose_loved_flea_drip")}
            </span>
          </div>
        )}
      </div>

      <div className="high-contrast container mx-auto min-h-0 max-w-4xl grow self-stretch">
        <div
          tabIndex={0}
          className="mx-auto h-full max-w-prose overflow-auto py-5 text-justify text-lg focus-visible:outline-none md:text-xl"
          onClick={(e) => {
            if (recording) {
              e.preventDefault();
              e.stopPropagation();
              onControl(NavigationControls.NextSentence);
            }
          }}
        >
          {document.paragraphs.map((p, pidx) => (
            <p
              key={pidx}
              className={twJoin("px-3 pb-3 leading-loose transition-all")}
            >
              {p.sentences.map((s, sidx) => (
                <span
                  key={`${pidx}-${sidx}`}
                  className={twJoin(
                    "me-2 cursor-pointer border-b-2 border-e-8 border-neutral-content text-2xl last:border-e-0",
                    activeParagraphIndex == pidx &&
                      activeSentenceIndex == sidx &&
                      "bg-base-content text-base-300",
                  )}
                  ref={
                    activeParagraphIndex == pidx && activeSentenceIndex == sidx
                      ? activeSentenceElementRef
                      : null
                  }
                  onClick={(e) => {
                    if (!recording) {
                      e.preventDefault();
                      e.stopPropagation();
                      onControl(NavigationControls.GoToParagraph, {
                        paragraph: pidx,
                        sentence: sidx,
                      });
                    }
                  }}
                >
                  {s.text}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>

      {!!sessionStartError && (
        <div className="text-center text-error">
          {t("arable_teal_tern_greet")}
        </div>
      )}
      <div className="sticky bottom-0 sm:mx-auto sm:max-w-xl sm:px-2">
        {ready ? (
          <div
            className="p-4 px-4 text-center"
            onClick={() => onControl(NavigationControls.Record)}
          >
            {recording ? (
              <div className="btn btn-error join-item mx-auto w-full">
                <span>{t("bold_weird_okapi_win")}</span>
                <span className="font-mono text-xs font-bold md:text-lg">
                  {secondsToHourMinuteSecondString(recordingTimestamp)}
                </span>
              </div>
            ) : (
              <>
                <div className="btn btn-primary join-item mx-auto w-full">
                  {t("odd_next_gazelle_transform")}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="btn btn-disabled mx-auto my-4 flex w-full items-center">
            <span>{t("whole_lofty_starfish_propel")}</span>
            <span className="loading loading-dots loading-md mx-4"></span>
          </div>
        )}
      </div>
      <SessionFinalizeModal
        sessionId={sessionId}
        readyToFinalize={readyToFinalize}
        endSession={endSessionAndMoveOn}
        awaitingFinalization={awaitingSessionFinalization}
        setAwaitingFinalization={setAwaitingSessionFinalization}
      />

      <RecitalTipsBox />
    </div>
  );
};

export default RecitalBox;
