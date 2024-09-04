import { useCallback, useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { MicOffIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { secondsToMinuteSecondMillisecondString } from "@/utils";
import { useRecorder } from "@/hooks/recodingUploader";

// Get nispired by this https://restream.io/tools/mic-test

function getBinIndexByFrequency(frequency: number, frequencyBinWidth: number) {
  return Math.round(frequency / frequencyBinWidth);
}

function visualizeAndAssessAudioRecording(
  analyzer: AnalyserNode | null,
  canvas: HTMLCanvasElement | null,
  active: React.RefObject<boolean>,
  audioScore: React.MutableRefObject<number>,
) {
  if (analyzer && canvas) {
    const frequencyBinWidth =
      analyzer.context.sampleRate / 2 / analyzer.frequencyBinCount;
    const speechRangeEndBinIdx = getBinIndexByFrequency(
      8000,
      frequencyBinWidth,
    );
    const inspectUpToBin = speechRangeEndBinIdx;
    const dataArray = new Uint8Array(analyzer.frequencyBinCount);
    analyzer.getByteFrequencyData(dataArray);
    const canvasCtx = canvas.getContext("2d");
    audioScore.current = 0.5;

    const minAudioLevelForSpeachRange = 100;

    if (!canvasCtx) return;

    const draw = () => {
      analyzer.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      canvasCtx.fillStyle = "hsl(50 100% 50%)";

      const barWidth = canvas.width / inspectUpToBin;
      let barX = 0;
      let totalGain = 0;
      for (let i = 0; i < inspectUpToBin; i++) {
        totalGain += dataArray[i];
        const barHeight = (dataArray[i] / 255.0) * canvas.height;

        canvasCtx.fillRect(
          barX + 2,
          canvas.height - barHeight,
          barWidth - 4,
          barHeight,
        );

        barX += barWidth;
      }
      const avgGain = totalGain / inspectUpToBin;
      if (avgGain > minAudioLevelForSpeachRange) {
        audioScore.current = 0.8 * audioScore.current + 0.2;
      } else {
        audioScore.current = 0.8 * audioScore.current;
      }

      if (active.current) {
        requestAnimationFrame(draw);
      }
    };

    requestAnimationFrame(draw);
  }
}

function clearCanvas(canvas: HTMLCanvasElement | null) {
  if (canvas) {
    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) return;
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
};

const MicCheck = ({ open, onClose }: Props) => {
  const posthog = usePostHog();
  const [hasAudio, setHasAudio] = useState(false);
  const audioHtmlElemRef = useRef<HTMLMediaElement>(null);
  const analyserCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioRecordingScore = useRef<number>(0.5);
  const [displayedScore, setDisplayedScore] = useState(0.5);

  const onAudio = useCallback((audio: Blob) => {
    if (audioHtmlElemRef.current) {
      audioHtmlElemRef.current.src = URL.createObjectURL(audio);
      setHasAudio(true);
    }
  }, []);

  const [playing, setPlaying] = useState(false);
  const [playLoading, setPlayLoading] = useState(false);
  useEffect(() => {
    if (audioHtmlElemRef.current) {
      if (playing) {
        posthog?.capture("Mic Check Recording Played");
        audioHtmlElemRef.current.currentTime = 0;
        setPlayLoading(true);
        audioHtmlElemRef.current.play().then(() => setPlayLoading(false));
      } else {
        posthog?.capture("Mic Check Recording Stopped");
        audioHtmlElemRef.current.pause();
      }
    }
  }, [playing]);

  const {
    ready,
    recording,
    recordingTimestamp,
    microphone,
    startRecording,
    stopRecording,
  } = useRecorder(onAudio, 0, { analyzer: true });
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  const analyserDrawingActive = useRef(false);

  const start = useCallback(async () => {
    posthog?.capture("Mic Check Started");
    setHasAudio(false);
    setStarting(true);
    await startRecording();
    setStarting(false);
    analyserDrawingActive.current = true;
    visualizeAndAssessAudioRecording(
      microphone.current && microphone.current.getAnalyser(),
      analyserCanvasRef.current,
      analyserDrawingActive,
      audioRecordingScore,
    );
  }, [startRecording]);

  const stop = useCallback(async () => {
    posthog?.capture("Mic Check Stopped");
    setStopping(true);
    analyserDrawingActive.current = false;
    await stopRecording();
    setStopping(false);
    setDisplayedScore(audioRecordingScore.current);
  }, [stopRecording]);

  useEffect(() => {
    // Cleanups
    return () => {
      setHasAudio(false);
      analyserDrawingActive.current = false;
      setPlaying(false);
      setPlayLoading(false);
      audioHtmlElemRef.current?.pause();
      clearCanvas(analyserCanvasRef.current);
      stopRecording();
    };
  }, [stopRecording, open]);

  return (
    <div className="card card-compact">
      <div className="card-title">הלו? הלו?!</div>
      <div className="card-body">
        <p>רצוי לנסות לבצע הקלטה ולשמוע את עצמך מדבר</p>
        <audio ref={audioHtmlElemRef} onEnded={() => setPlaying(false)} />
        <div className="relative flex h-[170px] items-center justify-center overflow-clip rounded-lg bg-base-200 px-5">
          {recording && (
            <div className="absolute top-0 pt-4 font-mono text-sm text-base-content">
              {secondsToMinuteSecondMillisecondString(recordingTimestamp)}
            </div>
          )}
          {hasAudio && (
            <span className="badge badge-info badge-md absolute top-0 mt-2">
              {displayedScore > 0.8 ? "נשמע טוב!" : "כנראה חלש מידי"}
            </span>
          )}
          <canvas
            className="absolute bottom-0 w-full opacity-60"
            ref={analyserCanvasRef}
            height="110"
          />
          {ready ? (
            <div className="card-actions z-10">
              {recording ? (
                <button className="btn btn-error" onClick={stop}>
                  {stopping ? (
                    <span className="loading-sx loading-infinity" />
                  ) : (
                    "עצור"
                  )}
                </button>
              ) : (
                <button className="btn btn-accent" onClick={start}>
                  {starting ? (
                    <span className="loading-sx loading-infinity" />
                  ) : hasAudio ? (
                    "נסיון נוסף"
                  ) : (
                    "הקלט"
                  )}
                </button>
              )}

              <button
                className={twMerge("btn btn-info", !hasAudio && "btn-disabled")}
                onClick={() => setPlaying((playing) => !playing)}
              >
                {playLoading ? (
                  <span className="loading loading-infinity loading-xs" />
                ) : playing ? (
                  "עצור"
                ) : (
                  "נגן"
                )}
              </button>
            </div>
          ) : (
            <div className="alert alert-info text-sm">
              <span>אנא אשר שימוש במיקרופון</span>
              <MicOffIcon className="h-4 w-4 text-red-500" />
            </div>
          )}
        </div>
        <div className="card-actions justify-center sm:justify-end">
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            סיימתי
          </button>
        </div>
      </div>
    </div>
  );
};

type ModalProps = {
  open: boolean;
  onClose: () => void;
};

export const MicCheckModal = ({ open, onClose }: ModalProps) => {
  const modalRef = useRef<HTMLDialogElement>(null);
  const posthog = usePostHog();

  useEffect(() => {
    if (modalRef.current) {
      if (open) {
        modalRef.current?.showModal();
        posthog?.capture("Mic Check Displayed");
      } else {
        modalRef.current?.close();
        posthog?.capture("Mic Check Dismissed");
      }
    }
  }, [open]);

  return (
    <dialog
      ref={modalRef}
      className="modal modal-bottom sm:modal-middle"
      onCancel={onClose}
    >
      <div className="modal-box">
        <MicCheck open={open} onClose={onClose} />
      </div>
    </dialog>
  );
};

export default MicCheck;
