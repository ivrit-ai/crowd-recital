import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { SegmentedAudioDataUploader } from "./uploader";
import { Microphone } from "./capture";

const useRecordingTimestamp = (
  microphoneRef: React.MutableRefObject<Microphone | null>,
) => {
  const getRecordingTimestampSnapshot = useCallback(() => {
    return microphoneRef.current?.getCurrentTime() || 0;
  }, []);
  const subscribeToRecodingTimestamp = useCallback((callback: () => void) => {
    microphoneRef.current?.addEventListener("timestamp", callback);
    return () => {
      microphoneRef.current?.removeEventListener("timestamp", callback);
    };
  }, []);

  return useSyncExternalStore<number>(
    subscribeToRecodingTimestamp,
    getRecordingTimestampSnapshot,
  );
};

export function useRecordingUploader(
  uploadSegmentSizeSeconds: number = 5,
  audioDataUploadUrl: string,
) {
  const [ready, setReady] = useState(false);
  const [uploaderError, setUploaderError] = useState<Error | null>(null);
  const [recording, setRecording] = useState(false);
  const microphoneRef = useRef<Microphone | null>(null);
  const segmentedAudioDataUploaderRef =
    useRef<SegmentedAudioDataUploader | null>(null);

  useEffect(() => {
    const uploadErrorHandler = (e: Event) => {
      const errorEvent = e as ErrorEvent;
      setUploaderError(errorEvent.error);
    };
    const init = async () => {
      const mic = new Microphone(uploadSegmentSizeSeconds);
      microphoneRef.current = mic;
      const uploader = new SegmentedAudioDataUploader(audioDataUploadUrl);
      segmentedAudioDataUploaderRef.current = uploader;
      segmentedAudioDataUploaderRef.current.addEventListener(
        "error",
        uploadErrorHandler,
      );

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
      segmentedAudioDataUploaderRef.current?.removeEventListener(
        "error",
        uploadErrorHandler,
      );
      microphoneRef.current = null;
      segmentedAudioDataUploaderRef.current = null;
    };
  }, [uploadSegmentSizeSeconds, audioDataUploadUrl]);

  const recordingTimestamp = useRecordingTimestamp(microphoneRef);

  const startRecording = useCallback(
    async (sessionId?: string) => {
      if (
        sessionId &&
        microphoneRef.current &&
        segmentedAudioDataUploaderRef.current
      ) {
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
            setUploaderError(null);
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
    [recording],
  );

  const stopRecording = useCallback(async () => {
    if (microphoneRef.current && segmentedAudioDataUploaderRef.current) {
      if (microphoneRef.current.isRecording()) {
        await microphoneRef.current.stopRecording();
        await segmentedAudioDataUploaderRef.current.stop();
      }
      setRecording(false);
    }
  }, [recording]);

  return {
    ready,
    uploaderError,
    recording,
    recordingTimestamp,
    startRecording,
    stopRecording,
  };
}

type UseRecorderConfiguration = {
  analyzer: boolean;
};

export function useRecorder(
  onAudioCallback: ((audioData: Blob, mimeType: string) => void) | null,
  segmentSizeSecond: number = 0,
  config: UseRecorderConfiguration = { analyzer: false },
) {
  // Latest ref pattern - we will use the latest callback but never
  // render because of it changing
  const onAudioCallbackRef = useRef(onAudioCallback);
  useLayoutEffect(() => {
    onAudioCallbackRef.current = onAudioCallback;
  });

  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const microphoneRef = useRef<Microphone | null>(null);

  useEffect(() => {
    const init = async () => {
      const mic = new Microphone(segmentSizeSecond, !!config.analyzer);
      microphoneRef.current = mic;

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
      microphoneRef.current = null;
    };
  }, [segmentSizeSecond]);

  const recordingTimestamp = useRecordingTimestamp(microphoneRef);

  const startRecording = useCallback(async () => {
    if (microphoneRef.current) {
      let startedRecodingWithSuccess = false;
      if (!microphoneRef.current.isRecording()) {
        try {
          await microphoneRef.current.startRecording(
            onAudioCallbackRef.current,
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
  }, []);

  const stopRecording = useCallback(async () => {
    if (microphoneRef.current) {
      if (microphoneRef.current.isRecording()) {
        await microphoneRef.current.stopRecording();
      }
      setRecording(false);
    }
  }, []);

  return {
    ready,
    recording,
    recordingTimestamp,
    microphone: microphoneRef,
    startRecording,
    stopRecording,
  };
}
