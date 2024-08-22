import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { twJoin } from "tailwind-merge";

import { Document } from "../../models";
import { useKeyPress } from "../../utils";
import { useRecordingUploader } from "../../hooks/recodingUploader";
import { useTextSegmentUploader } from "../../hooks/textSegmentUploader";
import { useRecordingSession } from "../../hooks/useRecordingSession";

const textDataUploadUrl = "/api/upload-text-segment";
const audioDataUploadUrl = "/api/upload-audio-segment";
const createNewSessionUrl = "/api/new-recital-session";

function secondsToMinuteSecondMillisecondString(seconds: number): string {
  // Rounded seconds to ms
  const roundedSeconds = Math.round(seconds * 1000) / 1000;
  // Extract whole minutes, remaining whole seconds, and milliseconds
  const minutes = Math.floor(roundedSeconds / 60);
  const completeSeconds = Math.floor(roundedSeconds);
  const remainingSeconds = completeSeconds % 60;
  const milliseconds = Math.round((roundedSeconds - completeSeconds) * 1000);

  // Pad the minutes, seconds, and milliseconds with zeros to ensure correct length
  const paddedMinutes = minutes.toString().padStart(2, "0");
  const paddedSeconds = remainingSeconds.toString().padStart(2, "0");
  const paddedMilliseconds = milliseconds.toString().padStart(3, "0");

  // Concatenate minutes, seconds, and milliseconds as a mm:ss.zzz format
  return `${paddedMinutes}:${paddedSeconds}.${paddedMilliseconds}`;
}

type NavigationMoves = {
  nextParagraph: () => void;
  prevParagraph: () => void;
  nextSentence: () => void;
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
        return; // No where to go further
      }
      setActiveParagraphIndex((prev) => prev + 1);
      setActiveSentenceIndex(0);
    } else {
      setActiveSentenceIndex((prev) => prev + 1);
    }
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
  createNewSession: () => Promise<string>,
  setSessionId: (sessionId: string) => void,
  startRecording: (sessionId: string) => void,
  stopRecording: () => void,
  uploadActiveSentence: () => void,
) => {
  const onControl = useCallback(
    async (control: NavigationControls, navigationArgs?: NavigationArgs) => {
      switch (control) {
        case NavigationControls.NextSentence:
          if (recording) {
            uploadActiveSentence();
          }
          move.nextSentence();
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
            uploadActiveSentence();
            stopRecording();
          } else {
            createNewSession().then((sessionId) => {
              setSessionId(sessionId);
              startRecording(sessionId);
            });
          }
          break;

        default:
          break;
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
  const [sessionId, setSessionId] = useState<string>("");
  const { activeParagraphIndex, activeSentenceIndex, activeSentence, move } =
    useDocumentNavigation(document);
  const activeSentenceElementRef = useRef<HTMLSpanElement>(null);

  const [createNewSession] = useRecordingSession(
    createNewSessionUrl,
    document?.id,
  );
  const {
    ready,
    recording,
    recordingTimestamp,
    startRecording,
    stopRecording,
  } = useRecordingUploader(5, audioDataUploadUrl);
  const [uploadTextSegment] = useTextSegmentUploader(
    sessionId,
    recordingTimestamp,
    textDataUploadUrl,
  );

  const uploadActiveSentence = useCallback(() => {
    uploadTextSegment(activeSentence.text).then(() => {
      console.log("Uploaded Text Segment!");
    });
  }, [activeSentence, uploadTextSegment]);

  const onControl = useControlCallback(
    move,
    recording,
    createNewSession,
    setSessionId,
    startRecording,
    stopRecording,
    uploadActiveSentence,
  );

  useKeyboardControl(onControl);

  useEffect(() => {
    activeSentenceElementRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeParagraphIndex, activeSentenceIndex]);

  return (
    <div className="h-screen-minus-topbar flex w-full flex-col content-between">
      <header className="bg-base-200 p-4">
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
      </header>

      <div className="nokbd:hidden flex items-center justify-center gap-4 pt-4">
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
                    "border-b-2 border-s-8 border-neutral-content me-2",
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

      <div className="sm:mx-auto sm:max-w-xl">
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
      </div>
    </div>
  );
};

export default RecitalBox;
