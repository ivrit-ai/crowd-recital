import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { SegmentedAudioDataUploader } from "./uploader";
import { Microphone } from "./capture";

export function useRecordingUploader(
  uploadSegmentSizeSeconds: number = 5,
  audioDataUploadUrl: string,
) {
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const microphoneRef = useRef<Microphone | null>(null);
  const segmentedAudioDataUploaderRef =
    useRef<SegmentedAudioDataUploader | null>(null);

  useEffect(() => {
    const init = async () => {
      const mic = new Microphone(uploadSegmentSizeSeconds);
      microphoneRef.current = mic;
      const uploader = new SegmentedAudioDataUploader(audioDataUploadUrl);
      segmentedAudioDataUploaderRef.current = uploader;

      try {
        await mic.requestPermission();
        setReady(true);
      } catch {
        setReady(false);
      }
    };

    init();

    return () => {
      microphoneRef.current?.stopRecording();
      segmentedAudioDataUploaderRef.current?.stop();
      microphoneRef.current = null;
      segmentedAudioDataUploaderRef.current = null;
    };
  }, [setReady, uploadSegmentSizeSeconds, audioDataUploadUrl]);

  const getRecordingTimestampSnapshot = useCallback(() => {
    return microphoneRef.current?.getCurrentTime() || 0;
  }, []);
  const subscribeToRecodingTimestamp = useCallback((callback: () => void) => {
    microphoneRef.current?.addEventListener("timestamp", callback);
    return () => {
      microphoneRef.current?.removeEventListener("timestamp", callback);
    };
  }, []);

  const recordingTimestamp = useSyncExternalStore<number>(
    subscribeToRecodingTimestamp,
    getRecordingTimestampSnapshot,
  );

  const startRecording = useCallback(
    async (sessionId?: string) => {
      if (
        sessionId &&
        microphoneRef.current &&
        segmentedAudioDataUploaderRef.current
      ) {
        console.log(`StartRecording->`);
        let startedRecodingWithSuccess = false;
        if (!microphoneRef.current.isRecording()) {
          try {
            await segmentedAudioDataUploaderRef.current?.start(sessionId);
            await microphoneRef.current.startRecording(
              segmentedAudioDataUploaderRef.current?.addAudioBlob.bind(
                segmentedAudioDataUploaderRef.current,
              ),
            );
            setReady(true);
            startedRecodingWithSuccess = true;
          } catch {
            setReady(false);
          }
        }

        if (startedRecodingWithSuccess) {
          setRecording(true);
        }
      }
    },
    [setReady, recording, setRecording],
  );

  const stopRecording = useCallback(async () => {
    if (microphoneRef.current && segmentedAudioDataUploaderRef.current) {
      console.log(`StopRecording->`);
      if (microphoneRef.current.isRecording()) {
        await microphoneRef.current.stopRecording();
        await segmentedAudioDataUploaderRef.current.stop();
      }
      setRecording(false);
    }
  }, [setReady, recording, setRecording]);

  return {
    ready,
    recording,
    recordingTimestamp,
    startRecording,
    stopRecording,
  };
}
