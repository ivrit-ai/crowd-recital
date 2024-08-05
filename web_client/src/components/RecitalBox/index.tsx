import { useCallback, useEffect, useRef, useState } from "react";
import { twJoin } from "tailwind-merge";
import { useKeyboard } from "react-aria";
import { Meter, Label } from "react-aria-components";

import { Document, Sentence } from "../../models";

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

const TARGET_RECORDING_LENGTH_SEC = 26;
const TARGET_RECORDING_LENGTH_TOLERANCE_SEC = 2;
const BASE_AVG_WPM_READ_SPEED = 120;
const AVG_WPM_EWMA_ALPHA = 0.2;

type StoredRecording = {
  sentences: Sentence[];
  duration: number;
};
const fakeRecordingStorage: StoredRecording[] = [];
async function storeRecording(sentences: Sentence[], duration: number) {
  fakeRecordingStorage.push({ sentences, duration });
  await new Promise((resolve) => setTimeout(resolve, 250));
}
async function loadRecordingsStore(): Promise<StoredRecording[]> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return fakeRecordingStorage;
}

type StyledKbdProps = {
  children: React.ReactNode;
  disabled?: boolean;
};

const StyledKbd = ({ children, disabled = false }: StyledKbdProps) => {
  return (
    <kbd
      className={twJoin(
        "inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white font-semibold text-gray-100 shadow-sm transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:ring-gray-300",
        disabled && "opacity-20",
      )}
    >
      {children}
    </kbd>
  );
};

type RecitalBoxProps = {
  document: Document;
};

const RecitalBox = ({ document }: RecitalBoxProps) => {
  const [activeParagraphIndex, setActiveParagraphIndex] = useState<number>(0);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(0);
  const activeSentenceRef = useRef<HTMLSpanElement>(null);
  const [recording, setRecording] = useState<boolean>(false);
  const [recordedSentences, setRecordedSentences] = useState<Sentence[]>([]);
  const [recordingLength, setRecordingLength] = useState<number>(0);
  const [avgWpm, setAvgWpm] = useState<number>(BASE_AVG_WPM_READ_SPEED);
  const [recordingsStore, setRecordingsStore] = useState<StoredRecording[]>([]);

  const stopRecording = useCallback(() => {
    if (recording) {
      setRecording(false);
    }
  }, [recording]);

  const startRecording = useCallback(() => {
    if (!recording) {
      // Always start clean
      setRecordingLength(0);
      setRecordedSentences([]);
      setRecording(true);
    }
  }, [recording]);

  const nextAudioRecording = useCallback(async () => {
    const latestRecordingRecordedSentences = recordedSentences;
    const latestRecordingRecordedDuration = recordingLength;
    // Store
    storeRecording(
      latestRecordingRecordedSentences,
      latestRecordingRecordedDuration,
    )
      .then(() => loadRecordingsStore())
      .then(setRecordingsStore);
    // And start a new audio recording
    setRecordingLength(0);
    setRecordedSentences([]);
  }, [recordedSentences, recordingLength, startRecording, stopRecording]);

  // TODO - factor out
  const activeParagraph = document.paragraphs[activeParagraphIndex];
  const activeSentence = activeParagraph.sentences[activeSentenceIndex];
  const isLastParagraph =
    activeParagraphIndex === document.paragraphs.length - 1;
  const isLastSentence =
    activeSentenceIndex === activeParagraph.sentences.length - 1;
  const nextSentenceIndex = isLastSentence
    ? isLastParagraph
      ? activeSentenceIndex
      : 0
    : activeSentenceIndex + 1;
  const nextParagraphIndex = isLastParagraph
    ? activeParagraphIndex
    : isLastSentence
      ? activeParagraphIndex + 1
      : activeParagraphIndex;
  const nextSentence =
    document.paragraphs[nextParagraphIndex].sentences[nextSentenceIndex];
  const nextSentenceWordsToRead =
    nextSentence === activeSentence ? 0 : nextSentence.wordCount;
  const expectedDurationOfNextSentenceSec =
    (nextSentenceWordsToRead / avgWpm) * 60;
  const expectedTotalDurationIfNextSentenceIsRead =
    recordingLength + expectedDurationOfNextSentenceSec;
  const shouldStartNewRecordingBeforeNextSentence =
    expectedTotalDurationIfNextSentenceIsRead > TARGET_RECORDING_LENGTH_SEC;

  useEffect(() => {
    if (recording) {
      setRecordedSentences((prev) => {
        return [...prev, activeSentence];
      });
    }
  }, [recording, activeSentence]);

  const updateAvgWpmAfterSentenceRead = useCallback(() => {
    // Assumes this is called as the sentence reading is done - recording length
    // thus represent the time it took to read all recorded sentences at this point
    // Update avg reading speed on recorded sentences (not including the one just that has started right now)
    if (recording && recordingLength && recordedSentences.length > 1) {
      let totalWordsRecorded = 0;
      for (const sentence of recordedSentences) {
        totalWordsRecorded += sentence.wordCount;
      }
      // Ignore too small samples
      if (totalWordsRecorded > 10) {
        const thisSampleAvgWpm = Math.round(
          (totalWordsRecorded / recordingLength) * 60,
        );
        console.log(`Recording avg: ${thisSampleAvgWpm}`);
        // Use the prev avg and curr avg with exponential decay
        setAvgWpm((prev) => {
          return Math.round(
            prev * (1 - AVG_WPM_EWMA_ALPHA) +
              thisSampleAvgWpm * AVG_WPM_EWMA_ALPHA,
          );
        });
      }
    }
  }, [setAvgWpm, recording, recordedSentences, recordingLength]);

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
  }, [activeParagraphIndex, activeSentenceIndex, document]);

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
  }, [activeParagraphIndex, activeSentenceIndex, document]);

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
  }, [activeParagraphIndex, document]);

  const moveToPrevParagraph = useCallback(() => {
    const isFirstParagraph = activeParagraphIndex === 0;
    setActiveSentenceIndex(0);
    if (isFirstParagraph) {
      return; // No where to go further
    }
    setActiveParagraphIndex((prev) => prev - 1);
  }, [activeParagraphIndex, document]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // While recording - only move sequentially forward
      if (recording) {
        if (e.key === "ArrowLeft") {
          // Left - move to next sentence
          // If the recording time seems to be enough - store the recording.
          if (shouldStartNewRecordingBeforeNextSentence) {
            nextAudioRecording();
          }
          updateAvgWpmAfterSentenceRead();
          moveToNextSentence();
        } else if (
          ["ArrowRight", "ArrowUp", "ArrowDown", "Enter"].includes(e.key)
        ) {
          if (e.key === "Enter") {
            // Enter - stop recording
            nextAudioRecording();
            stopRecording();
          }
          e.preventDefault();
        }
      } else {
        if (e.key === "ArrowLeft") {
          // Left - move to next sentence
          moveToNextSentence();
        } else if (e.key === "ArrowRight") {
          moveToPrevSentence();
        }
        // If up increase paragraph if down decrease
        else if (e.key === "ArrowUp") {
          moveToPrevParagraph();
        } else if (e.key === "ArrowDown") {
          moveToNextParagraph();
        } else if (e.key === "Enter") {
          startRecording();
          e.preventDefault();
        }
      }
    },
    [
      moveToNextSentence,
      moveToPrevSentence,
      moveToNextParagraph,
      moveToPrevParagraph,
      recording,
      stopRecording,
      shouldStartNewRecordingBeforeNextSentence,
      updateAvgWpmAfterSentenceRead,
    ],
  );

  const { keyboardProps } = useKeyboard({
    onKeyDown: (e) => handleKeyDown(e),
  });

  useEffect(() => {
    activeSentenceRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeParagraphIndex, activeSentenceIndex]);

  // Keep a recording length timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (recording) {
      timer = setInterval(() => {
        setRecordingLength((prev) => prev + 0.1);
      }, 100);
    }
    return () => {
      clearInterval(timer);
    };
  }, [recording]);

  const recordingLengthTargetDiff =
    TARGET_RECORDING_LENGTH_SEC - recordingLength;

  const recordingLengthFeedback =
    Math.abs(recordingLengthTargetDiff) < TARGET_RECORDING_LENGTH_TOLERANCE_SEC
      ? "goodTimeToStop"
      : recordingLengthTargetDiff > 0
        ? "keepGoing"
        : "tooLong";

  // const recordingLengthFeedbackPrompt =
  //   recordingLengthFeedback === "goodTimeToStop"
  //     ? "זמן טוב לעצור"
  //     : recordingLengthFeedback === "keepGoing"
  //       ? "המשך להקליט"
  //       : "אנא עצור";

  const recordingLengthMeterFeedbackBgColor =
    recordingLengthFeedback === "goodTimeToStop"
      ? "bg-green-600"
      : recordingLengthFeedback === "keepGoing"
        ? "bg-blue-400"
        : "bg-red-600";
  // const recordingLengthMeterFeedbacTextColor =
  //   recordingLengthFeedback === "goodTimeToStop"
  //     ? "text-green-600"
  //     : recordingLengthFeedback === "keepGoing"
  //       ? "text-blue-400"
  //       : "text-red-600";

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-1 flex flex-col items-center justify-center gap-4">
          <StyledKbd>⏎</StyledKbd> {recording ? "עצור" : "התחל"} הקלטה
          <StyledKbd disabled={recording}>&uarr;</StyledKbd> פסקה קודמת
          <StyledKbd disabled={recording}>&darr;</StyledKbd> פסקה הבאה
          <StyledKbd>&larr;</StyledKbd> משפט הבא
          <StyledKbd disabled={recording}>&rarr;</StyledKbd> משפט קודם
        </div>
        <div
          {...keyboardProps}
          tabIndex={0}
          className="col-span-3 max-h-96 max-w-prose overflow-auto py-10 text-justify text-xl"
        >
          {document.paragraphs.map((p, pidx) => (
            <p
              key={pidx}
              className={twJoin(
                "px-3 leading-loose transition-all",
                activeParagraphIndex != pidx && "blur-sm",
              )}
            >
              {p.sentences.map((s, sidx) => (
                <span
                  key={`${pidx}-${sidx}`}
                  className={twJoin(
                    "border-1 border border-x-4 border-gray-300",
                    activeParagraphIndex == pidx &&
                      activeSentenceIndex == sidx &&
                      "bg-green-200",
                  )}
                  ref={
                    activeParagraphIndex == pidx && activeSentenceIndex == sidx
                      ? activeSentenceRef
                      : null
                  }
                >
                  {s.text}.{" "}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>
      <div>{avgWpm}</div>
      {/* <div className="min-h-10 text-center">
        <div>{avgWpm}</div>
        {recording ? (
          <span
            className={twJoin("text-xl", recordingLengthMeterFeedbacTextColor)}
          >
            {recordingLengthFeedbackPrompt} - לחץ Enter כדי לעצור את ההקלטה
          </span>
        ) : (
          <span className="text-green-600">לחץ Enter כדי להתחיל בהקלטה</span>
        )}
      </div> */}

      <Meter value={recordingLength} maxValue={30}>
        {({ percentage }) => (
          <>
            <div className="h-4 w-full overflow-hidden rounded border-gray-300 shadow forced-color-adjust-none">
              <div
                className={twJoin(
                  "h-full",
                  recordingLengthMeterFeedbackBgColor,
                )}
                style={{ width: percentage + "%" }}
              />
            </div>
            <div className="text-center">
              <Label>משך הקלטה נוכחית </Label>
              <span className="font-mono">
                {secondsToMinuteSecondMillisecondString(recordingLength)}
              </span>
            </div>
            <div className="text-center">
              <Label>צפי אם ייקרא המשפט הבא </Label>
              <span className="font-mono">
                {secondsToMinuteSecondMillisecondString(
                  expectedTotalDurationIfNextSentenceIsRead,
                )}
              </span>
            </div>
          </>
        )}
      </Meter>

      <div className="max-h-40 w-auto overflow-auto">
        <div className="text-lg">אורכי הקלטות (דיבאג)</div>
        <div className="max-w-prose">
          <ul className="list-disc">
            {recordingsStore.map((rs, idx) => (
              <li key={idx} className="whitespace-nowrap">
                <span>
                  {secondsToMinuteSecondMillisecondString(rs.duration)}
                </span>
                <span className="inline-block max-w-prose overflow-auto">
                  {" "}
                  {rs.sentences.map((s) => s.text).join(". ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RecitalBox;
