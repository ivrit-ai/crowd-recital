import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { InfoIcon, MicIcon } from "lucide-react";
import { useVisibilityChange } from "@uidotdev/usehooks";
import { twJoin } from "tailwind-merge";

import { EnvConfig } from "@/config";
import { Document } from "@/models";
import { secondsToMinuteSecondMillisecondString } from "@/utils";
import { RouteContext, Routes } from "@/context/route";
import { MicCheckContext } from "@/context/micCheck";
import useDocumentNavigation, {
  NavigationControls,
} from "./useDocumentNavigation";
import useKeyboardControl from "./useKeyboardControl";
import useControlCallback from "./useControleCallback";
import { useRecordingUploader } from "@/hooks/recodingUploader";
import { useTextSegmentUploader } from "@/hooks/textSegmentUploader";
import { useRecordingSession } from "@/hooks/useRecordingSession";
import SessionInfoBox from "./SessionInfoBox";

const useAutoSessionStop = (
  finalizeSession: () => Promise<void>,
  audioUploaderError: Error | null,
  textUploaderError: Error | null,
) => {
  const finalizeSessionCbRef = useRef(finalizeSession); // Latest ref trick
  useLayoutEffect(() => {
    finalizeSessionCbRef.current = finalizeSession;
  });
  const [autoStopReason, setAutoStopReason] =
    useState<React.ReactElement | null>(null);
  const documentVisible = useVisibilityChange();
  useEffect(() => {
    let autoStoppedForReason = null;
    if (audioUploaderError || textUploaderError) {
      autoStoppedForReason = AutoStopReasons.uploadErrorReason;
    } else if (!documentVisible) {
      autoStoppedForReason = AutoStopReasons.documentInvisible;
    }

    if (autoStoppedForReason) {
      finalizeSessionCbRef.current();
      setAutoStopReason(autoStoppedForReason);
    }
  }, [audioUploaderError, textUploaderError, documentVisible]);

  return { autoStopReason };
};

const AutoStopReasons = {
  uploadErrorReason: (
    <div>
      <div>ארעה שגיאה בזמן ההקלטה - עצרנו את ההקלטה ליתר ביטחון.</div>
      <div>
        מה שהוקלט עד כה, ככל הנראה נשמר - על כל פנים, אנא יידע אותנו בבעיה.
      </div>
      <div>נודה לך אם תתחיל הקלטה מהמקום בו זו נעצרה, משפט אחד אחורה.</div>
    </div>
  ),
  documentInvisible: (
    <div>
      <div>נראה שעברת לעבוד על משהו אחר - עצרנו את ההקלטה בינתיים.</div>
      <div>מה שהוקלט עד כה נשמר.</div>
    </div>
  ),
} as const;

type RecitalBoxProps = {
  document: Document;
  clearActiveDocument: () => void;
};

const RecitalBox = ({ document, clearActiveDocument }: RecitalBoxProps) => {
  const { setActiveRoute } = useContext(RouteContext);
  const [sessionStartError, setSessionStartError] = useState<Error | null>(
    null,
  );
  const [sessionId, setSessionId] = useState<string>("");
  const { activeParagraphIndex, activeSentenceIndex, activeSentence, move } =
    useDocumentNavigation(document);
  const activeSentenceElementRef = useRef<HTMLSpanElement>(null);
  const { setMicCheckActive } = useContext(MicCheckContext);

  const [createNewSession, endSession] = useRecordingSession(document?.id);
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

  const uploadActiveSentence = useCallback(() => {
    uploadTextSegment(activeSentence.text).then(() => {
      if (import.meta.env.DEV) {
        console.log("Uploaded Text Segment!");
      }
    });
  }, [activeSentence, uploadTextSegment]);

  const finalizeSession = useCallback(async () => {
    await stopRecording();
    await uploadActiveSentence();
    await endSession(sessionId);
  }, [stopRecording, uploadActiveSentence, endSession, sessionId]);

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

  useKeyboardControl(onControl);

  useEffect(() => {
    activeSentenceElementRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeParagraphIndex, activeSentenceIndex]);

  const { autoStopReason } = useAutoSessionStop(
    finalizeSession,
    audioUploaderError,
    textUploaderError,
    // TODO: Add signal "speech input present"
    // TODO: Add signal "last sentence sent at"
  );

  return (
    <div className="flex h-screen-minus-topbar w-full flex-col content-between">
      <header className="bg-base-200 p-4">
        <div className="flex flex-row justify-between">
          <div className="mx-auto flex w-full max-w-4xl flex-col justify-center gap-2 md:flex-row md:items-center md:justify-around md:gap-4 md:px-6">
            <div className="min-w-0">
              <div className="text-sm font-bold md:text-lg">
                מסמך טקסט{" "}
                {!recording && (
                  <a
                    className="btn btn-link btn-sm text-primary"
                    onClick={clearActiveDocument}
                  >
                    החלף
                  </a>
                )}
              </div>
              <div className="truncate text-sm">{document.title}</div>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold md:text-lg">
                סשן הקלטה{" "}
                {!recording && (
                  <a
                    className="btn btn-link btn-sm text-primary"
                    onClick={() => setActiveRoute(Routes.Sessions)}
                  >
                    הקלטות
                  </a>
                )}
              </div>
              <div className="truncate text-sm">
                {recording ? (
                  <span className="text-error">מקליט</span>
                ) : (
                  <SessionInfoBox id={sessionId} />
                )}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <span
              className="btn btn-outline btn-sm sm:btn-xs"
              onClick={() => setMicCheckActive(true)}
            >
              בדיקה <MicIcon className="inline-block h-4 w-4" />
            </span>
          </div>
        </div>
      </header>

      {autoStopReason ? (
        <div className="alert alert-error mx-auto max-w-2xl">
          <InfoIcon className="h-8 w-8 flex-shrink-0" />
          {autoStopReason}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-4 pt-4 nokbd:hidden">
          <span>
            <kbd className="kbd kbd-sm">⏎</kbd> {recording ? "עצור" : "התחל"}{" "}
            הקלטה
          </span>
          {!recording && (
            <span>
              <kbd className="kbd kbd-sm">&uarr;</kbd> פסקה קודמת
            </span>
          )}
          {!recording && (
            <span>
              <kbd className="kbd kbd-sm">&darr;</kbd> פסקה הבאה
            </span>
          )}
          <span>
            <kbd className="kbd kbd-sm">&larr;</kbd> משפט הבא
          </span>
          <span>
            <kbd className="kbd kbd-sm">&rarr;</kbd> משפט קודם
          </span>
        </div>
      )}

      <div className="container mx-auto min-h-0 max-w-4xl grow self-stretch">
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
                    "me-2 cursor-pointer border-b-2 border-s-8 border-neutral-content",
                    activeParagraphIndex == pidx &&
                      activeSentenceIndex == sidx &&
                      "bg-primary text-primary-content",
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
          ארעה תקלה ביצירת סשן ההקלטה
        </div>
      )}
      <div className="sm:mx-auto sm:max-w-xl sm:px-2">
        {ready ? (
          <div
            className="p-4 px-4 text-center"
            onClick={() => onControl(NavigationControls.Record)}
          >
            {recording ? (
              <div className="btn btn-error join-item mx-auto w-full">
                <span>עצור הקלטה</span>
                <span className="font-mono text-xs font-bold md:text-lg">
                  {secondsToMinuteSecondMillisecondString(recordingTimestamp)}
                </span>
              </div>
            ) : (
              <div className="btn btn-primary join-item mx-auto w-full">
                התחל הקלטה
              </div>
            )}
          </div>
        ) : (
          <div className="btn btn-disabled mx-auto my-4 flex w-full items-center">
            <span>מאתחל מיקרופון</span>
            <span className="loading loading-dots loading-md mx-4"></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecitalBox;
