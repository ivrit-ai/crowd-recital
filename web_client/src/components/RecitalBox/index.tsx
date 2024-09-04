import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { InfoIcon, MicIcon } from "lucide-react";
import { twJoin } from "tailwind-merge";

import { EnvConfig } from "@/config";
import { Document } from "@/models";
import { useKeyPress, secondsToMinuteSecondMillisecondString } from "@/utils";
import { MicCheckContext } from "@/context/micCheck";
import { useRecordingUploader } from "../../hooks/recodingUploader";
import { useTextSegmentUploader } from "../../hooks/textSegmentUploader";
import { useRecordingSession } from "../../hooks/useRecordingSession";

const textDataUploadUrl = "/api/upload-text-segment";
const audioDataUploadUrl = "/api/upload-audio-segment";
const createNewSessionUrl = "/api/new-recital-session";
const endSessionUrl = "/api/end-recital-session";

type NavigationMoves = {
  nextParagraph: () => void;
  prevParagraph: () => void;
  nextSentence: () => boolean;
  prevSentence: () => void;
  toParagraphSentence: (paragraphIndex: number, sentenceIndex: number) => void;
};

const useDocumentNavigation = (document: Document) => {
  const [activeParagraphIndex, setActiveParagraphIndex] = useState<number>(0);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(0);

  const goToParagraphSentence = useCallback(
    (paragraphIndex: number, sentenceIndex: number) => {
      const paragraphIndexToGoTo = Math.max(
        0,
        Math.min(paragraphIndex, document.paragraphs.length - 1),
      );
      const sentenceIndexToGoTo = Math.max(
        0,
        Math.min(
          sentenceIndex,
          document.paragraphs[paragraphIndexToGoTo].sentences.length - 1,
        ),
      );
      setActiveParagraphIndex(paragraphIndexToGoTo);
      setActiveSentenceIndex(sentenceIndexToGoTo);
    },
    [setActiveParagraphIndex, setActiveSentenceIndex, document],
  );

  const moveToNextSentence = useCallback(() => {
    const activeParagraph = document.paragraphs[activeParagraphIndex];
    const isLastParagraph =
      activeParagraphIndex === document.paragraphs.length - 1;
    const isLastSentence =
      activeSentenceIndex === activeParagraph.sentences.length - 1;
    if (isLastSentence) {
      if (isLastParagraph) {
        return false; // No where to go further
      }
      setActiveParagraphIndex((prev) => prev + 1);
      setActiveSentenceIndex(0);
    } else {
      setActiveSentenceIndex((prev) => prev + 1);
    }

    return true;
  }, [
    setActiveParagraphIndex,
    setActiveSentenceIndex,
    activeParagraphIndex,
    activeSentenceIndex,
    document,
  ]);

  const moveToPrevSentence = useCallback(() => {
    const isFirstParagraph = activeParagraphIndex === 0;
    const isFirstSentence = activeSentenceIndex === 0;
    if (isFirstSentence) {
      if (isFirstParagraph) {
        return; // No where to go further
      }
      setActiveParagraphIndex((prev) => prev - 1);
      setActiveSentenceIndex(
        document.paragraphs[activeParagraphIndex - 1].sentences.length - 1,
      );
    } else {
      setActiveSentenceIndex((prev) => prev - 1);
    }
  }, [
    setActiveParagraphIndex,
    setActiveSentenceIndex,
    activeParagraphIndex,
    activeSentenceIndex,
    document,
  ]);

  const moveToNextParagraph = useCallback(() => {
    const isLastParagraph =
      activeParagraphIndex === document.paragraphs.length - 1;
    if (isLastParagraph) {
      setActiveSentenceIndex(
        document.paragraphs[activeParagraphIndex].sentences.length - 1,
      );
      return; // No where to go further
    }
    setActiveParagraphIndex((prev) => prev + 1);
    setActiveSentenceIndex(0);
  }, [
    setActiveParagraphIndex,
    setActiveSentenceIndex,
    activeParagraphIndex,
    document,
  ]);

  const moveToPrevParagraph = useCallback(() => {
    const isFirstParagraph = activeParagraphIndex === 0;
    setActiveSentenceIndex(0);
    if (isFirstParagraph) {
      return; // No where to go further
    }
    setActiveParagraphIndex((prev) => prev - 1);
  }, [
    setActiveParagraphIndex,
    setActiveSentenceIndex,
    activeParagraphIndex,
    document,
  ]);

  const activeParagraph = document.paragraphs[activeParagraphIndex];
  const activeSentence = activeParagraph.sentences[activeSentenceIndex];
  const move = useMemo<NavigationMoves>(
    () => ({
      nextParagraph: moveToNextParagraph,
      prevParagraph: moveToPrevParagraph,
      nextSentence: moveToNextSentence,
      prevSentence: moveToPrevSentence,
      toParagraphSentence: goToParagraphSentence,
    }),
    [
      moveToNextParagraph,
      moveToPrevParagraph,
      moveToNextSentence,
      moveToPrevSentence,
      goToParagraphSentence,
    ],
  );

  return {
    activeParagraphIndex,
    activeSentenceIndex,
    activeParagraph,
    activeSentence,
    move,
  } as const;
};

enum NavigationControls {
  NextSentence = 1,
  PrevSentence,
  NextParagraph,
  PrevParagraph,
  GoToParagraph,
  Record,
}

const useKeyboardControl = (
  onControl: (
    control: NavigationControls,
    navigationArgs?: NavigationArgs,
  ) => Promise<void>,
) => {
  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          await onControl(NavigationControls.PrevSentence);
          e.preventDefault();
          break;
        case "ArrowLeft":
          await onControl(NavigationControls.NextSentence);
          e.preventDefault();
          break;
        case "ArrowUp":
          await onControl(NavigationControls.PrevParagraph);
          e.preventDefault();
          break;
        case "ArrowDown":
          await onControl(NavigationControls.NextParagraph);
          e.preventDefault();
          break;
        case "Enter":
          await onControl(NavigationControls.Record);
          e.preventDefault();
          break;
        default:
          break;
      }
    },
    [onControl],
  );

  useKeyPress(
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter"],
    handleKeyDown,
  );
};

type NavigationArgs = {
  paragraph: number;
  sentence: number;
};

const useControlCallback = (
  move: NavigationMoves,
  recording: boolean,
  sessionId: string,
  createNewSession: () => Promise<string>,
  endSession: (sessionId: string) => Promise<void>,
  setSessionId: (sessionId: string) => void,
  startRecording: (sessionId: string) => void,
  stopRecording: () => void,
  uploadActiveSentence: () => void,
  setSessionStartError: (error: Error | null) => void,
  clearTextUploaderError: () => void,
) => {
  const onControl = useCallback(
    async (control: NavigationControls, navigationArgs?: NavigationArgs) => {
      let shouldStopRecording = false;
      switch (control) {
        case NavigationControls.NextSentence:
          if (recording) {
            uploadActiveSentence();
          }
          if (!move.nextSentence()) {
            shouldStopRecording = true;
          }
          break;
        case NavigationControls.PrevSentence:
          if (!recording) {
            move.prevSentence();
          }
          break;
        case NavigationControls.NextParagraph:
          if (!recording) {
            move.nextParagraph();
          }
          break;
        case NavigationControls.PrevParagraph:
          if (!recording) {
            move.prevParagraph();
          }
          break;
        case NavigationControls.GoToParagraph:
          if (!recording && navigationArgs) {
            move.toParagraphSentence(
              navigationArgs.paragraph,
              navigationArgs.sentence,
            );
          }
          break;
        case NavigationControls.Record:
          if (recording) {
            shouldStopRecording = true;
          } else {
            clearTextUploaderError();
            setSessionStartError(null);
            createNewSession()
              .then((sessionId) => {
                setSessionId(sessionId);
                startRecording(sessionId);
              })
              .catch((err) => setSessionStartError(err));
          }
          break;

        default:
          break;
      }

      if (shouldStopRecording) {
        uploadActiveSentence();
        stopRecording();
        endSession(sessionId);
      }
    },
    [
      move,
      recording,
      createNewSession,
      setSessionId,
      startRecording,
      stopRecording,
      uploadActiveSentence,
    ],
  );

  return onControl;
};

type RecitalBoxProps = {
  document: Document;
  clearActiveDocument: () => void;
};

const RecitalBox = ({ document, clearActiveDocument }: RecitalBoxProps) => {
  const [sessionStartError, setSessionStartError] = useState<Error | null>(
    null,
  );
  const [sessionId, setSessionId] = useState<string>("");
  const { activeParagraphIndex, activeSentenceIndex, activeSentence, move } =
    useDocumentNavigation(document);
  const activeSentenceElementRef = useRef<HTMLSpanElement>(null);
  const { setMicCheckActive } = useContext(MicCheckContext);

  const [createNewSession, endSession] = useRecordingSession(
    createNewSessionUrl,
    endSessionUrl,
    document?.id,
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
    audioDataUploadUrl,
  );
  const {
    uploadTextSegment,
    uploaderError: textUploaderError,
    clearUploaderError: clearTextUploaderError,
  } = useTextSegmentUploader(sessionId, recordingTimestamp, textDataUploadUrl);

  const uploadActiveSentence = useCallback(() => {
    uploadTextSegment(activeSentence.text).then(() => {
      console.log("Uploaded Text Segment!");
    });
  }, [activeSentence, uploadTextSegment]);

  const onControl = useControlCallback(
    move,
    recording,
    sessionId,
    createNewSession,
    endSession,
    setSessionId,
    startRecording,
    stopRecording,
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

  useEffect(() => {
    if (audioUploaderError || textUploaderError) {
      stopRecording();
    }
  }, [stopRecording, audioUploaderError, textUploaderError]);
  const uploaderError = audioUploaderError || textUploaderError;

  return (
    <div className="flex h-screen-minus-topbar w-full flex-col content-between">
      <header className="bg-base-200 p-4">
        <div className="flex flex-row justify-between">
          <div className="mx-auto flex w-full max-w-4xl flex-col justify-center gap-2 md:flex-row md:items-center md:justify-around md:gap-4 md:px-6">
            <div className="min-w-0">
              <div className="text-sm font-bold md:text-lg">
                מסמך טקסט{" "}
                <a
                  className="btn btn-link btn-sm text-primary"
                  onClick={clearActiveDocument}
                >
                  החלף
                </a>
              </div>
              <div className="truncate text-sm">{document.title}</div>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold md:text-lg">סשן הקלטה</div>
              <div className="truncate text-sm">
                {sessionId || "לא נוצר עדיין"}
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

      {uploaderError ? (
        <div className="alert alert-error mx-auto max-w-2xl">
          <InfoIcon className="h-8 w-8 flex-shrink-0" />
          <div>
            <div>ארעה שגיאה בזמן ההקלטה - עצרנו את ההקלטה ליתר ביטחון.</div>
            <div>
              מה שהוקלט עד כה, ככל הנראה נשמר - על כל פנים, אנא יידע אותנו
              בבעיה.
            </div>
            <div>
              נודה לך אם תתחיל הקלטה מהמקום בו זו נעצרה, משפט אחד אחורה.
            </div>
          </div>
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
                    "me-2 border-b-2 border-s-8 border-neutral-content",
                    activeParagraphIndex == pidx &&
                      activeSentenceIndex == sidx &&
                      "bg-primary text-primary-content",
                  )}
                  ref={
                    activeParagraphIndex == pidx && activeSentenceIndex == sidx
                      ? activeSentenceElementRef
                      : null
                  }
                  onClick={() =>
                    onControl(NavigationControls.GoToParagraph, {
                      paragraph: pidx,
                      sentence: sidx,
                    })
                  }
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
