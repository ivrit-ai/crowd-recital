import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import audioProcessorWorkletModuleUrl from "./audio-processor.js?url";

type AudioProcesserMessageEventData = {
  audio_data: ArrayBufferLike;
};

const chunkBufferLengthSecs: number = 1;
class Microphone extends EventTarget {
  private stream: MediaStream | null = null;
  private audioContext?: AudioContext;
  private audioWorkletNode?: AudioWorkletNode;
  private source?: MediaStreamAudioSourceNode;
  private audioBufferQueue = new Int16Array(0);
  private timestampNotifierIntervalId?: NodeJS.Timeout;
  private recording: boolean = false;
  private stopping: boolean = false;

  constructor() {
    super();
  }

  public isRecording() {
    return this.recording;
  }

  async requestPermission() {
    console.log("Requesting access...");
    if (!this.stream) {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("got it.");
    }
  }

  async startRecording(
    onAudioCallback:
      | ((sampleRate: number, audioData: Uint8Array) => void)
      | null,
  ) {
    if (this.recording || this.stopping) return;

    if (!this.stream) {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    console.log("startRecording()");

    this.recording = true;

    const audioContext = (this.audioContext = new AudioContext({
      latencyHint: "interactive",
    }));

    this.source = this.audioContext.createMediaStreamSource(this.stream);

    await this.audioContext.audioWorklet.addModule(
      audioProcessorWorkletModuleUrl,
    );
    this.audioWorkletNode = new AudioWorkletNode(
      audioContext,
      "audio-processor",
    );

    this.source.connect(this.audioWorkletNode);
    this.audioWorkletNode.connect(this.audioContext.destination);
    this.audioWorkletNode.port.onmessage = (
      event: MessageEvent<AudioProcesserMessageEventData>,
    ) => {
      const currentBuffer = new Int16Array(event.data.audio_data);
      this.audioBufferQueue = this.mergeBuffers(
        this.audioBufferQueue,
        currentBuffer,
      );

      const bufferDuration =
        (this.audioBufferQueue.length / audioContext.sampleRate) * 1000;

      if (bufferDuration >= chunkBufferLengthSecs * 1000 || this.stopping) {
        console.log(
          `Buffer dump: ${audioContext.currentTime} - ${this.stopping ? "Stopping..." : ""}`,
        );
        const totalSamplesToTake = this.stopping
          ? this.audioBufferQueue.length
          : Math.floor(audioContext.sampleRate * chunkBufferLengthSecs);

        const finalBuffer = new Uint8Array(
          this.audioBufferQueue.subarray(0, totalSamplesToTake).buffer,
        );

        this.audioBufferQueue =
          this.audioBufferQueue.subarray(totalSamplesToTake);
        if (onAudioCallback)
          onAudioCallback(audioContext.sampleRate, finalBuffer);
      }
    };

    this.timestampNotifierIntervalId = setInterval(
      this.emitTimestampEvent.bind(this),
      100,
    );

    console.log(`startRecording()-Done: ${this.audioContext.currentTime}`);
  }

  async stopRecording() {
    if (!this.recording) return;
    this.stopping = true;
    console.log("stopRecording()");
    this.stream?.getTracks().forEach((track) => track.stop());
    clearInterval(this.timestampNotifierIntervalId);
    await this.audioContext?.close();
    this.audioBufferQueue = new Int16Array(0);
    this.stream = null;
    this.recording = false;
    console.log("stopRecording()-Done.");
    this.stopping = false;
  }

  public getCurrentTime() {
    return this.audioContext?.currentTime;
  }

  private emitTimestampEvent() {
    this.dispatchEvent(
      new CustomEvent("timestamp", {
        detail: {
          timestamp: this.audioContext?.currentTime,
        },
      }),
    );
  }

  private mergeBuffers(lhs: Int16Array, rhs: Int16Array) {
    const mergedBuffer = new Int16Array(lhs.length + rhs.length);
    mergedBuffer.set(lhs, 0);
    mergedBuffer.set(rhs, lhs.length);
    return mergedBuffer;
  }
}

type UploadQueueItem = {
  segmentId: number;
  audioDataBuffers: Uint8Array[];
};

class SegmentedAudioDataUploader {
  private sampleWidth: number = 2; // Bytes per sample
  private audioDataBuffers: Uint8Array[] = [];
  private totalBufferedAudioSize: number = 0;
  private shuttingDown: boolean = false;
  private stopped: boolean = true;
  private nextSegmentId = 0;
  private uploadQueue: UploadQueueItem[] = [];
  private sampleRate: number = 0;
  private uploadEndpointUrl: string;
  private sessionId: string = "";
  private segmentDurationSec: number = 0;
  private waitForUploadQueueToExit!: Promise<void>;
  private notifyUploadQueueHasExited!: (
    value: void | PromiseLike<void>,
  ) => void;
  private waitForPendingUploadTask!: Promise<void>;
  private notifyPendingUploaTask!: (value: void | PromiseLike<void>) => void;

  constructor(uploadEndpointUrl: string, segmentDurationSec: number = 30) {
    this.uploadEndpointUrl = uploadEndpointUrl;
    this.segmentDurationSec = segmentDurationSec;
  }

  public async start(sessionId: string) {
    if (this.stopped) {
      this.sessionId = sessionId;
      this.stopped = false;
      this.shuttingDown = false;

      this.waitForUploadQueueToExit = new Promise((res) => {
        this.notifyUploadQueueHasExited = res;
      });
      this.waitForPendingUploadTask = new Promise((res) => {
        this.notifyPendingUploaTask = res;
      });

      this.processUploadQueue()
        .catch((err) => {
          console.error(err);
          this.stopped = true;
        })
        .finally(() => {
          this.stopped = true;
          this.shuttingDown = false;
          this.notifyUploadQueueHasExited();
        });
    }
  }

  public async stop() {
    if (!this.stopped && !this.shuttingDown) {
      this.shuttingDown = true;
      this.flushAudioBuffersToSegmentUpload();
      this.notifyPendingUploaTask();
      await this.waitForUploadQueueToExit;
    }
  }

  public addAudioDataBuffer(sampleRate: number, audioData: Uint8Array) {
    console.log(`<Uploader> Got audio data (${audioData.length})`);
    if (this.shuttingDown || this.stopped) {
      return;
    }

    this.sampleRate = sampleRate;
    this.audioDataBuffers.push(audioData);
    this.totalBufferedAudioSize += audioData.length;
    const totalBufferedAudioDuration: number =
      this.totalBufferedAudioSize / this.sampleWidth / this.sampleRate;

    console.log(`<Uploader> Buffer duration: ${totalBufferedAudioDuration}`);

    if (totalBufferedAudioDuration >= this.segmentDurationSec) {
      this.flushAudioBuffersToSegmentUpload();
    }
  }

  private flushAudioBuffersToSegmentUpload() {
    const bufferedDataToUpload = this.audioDataBuffers;
    // Don't flush empty buffers
    if (bufferedDataToUpload.length) {
      this.audioDataBuffers = [];
      this.totalBufferedAudioSize = 0;
      this.queueSegmentUpload(this.nextSegmentId, bufferedDataToUpload);
      this.nextSegmentId++;
    }
  }

  private queueSegmentUpload(
    segmentId: number,
    audioDataBuffers: Uint8Array[],
  ) {
    console.log("<Uploader> Queueing segment for upload");
    const uploadQueueItem: UploadQueueItem = {
      segmentId,
      audioDataBuffers,
    };
    this.uploadQueue.push(uploadQueueItem);
    this.notifyPendingUploaTask();
  }

  private async processUploadQueue() {
    console.log(
      `<Uploader> Starting upload queue processor for session ${this.sessionId}`,
    );
    while (!this.stopped && !this.shuttingDown) {
      // Wait until signalled that uploads are waiting
      await this.waitForPendingUploadTask;
      // Cpature any other work notifications
      const nextPromise = new Promise<void>((res) => {
        this.notifyPendingUploaTask = res;
      });
      this.waitForPendingUploadTask = nextPromise;

      // Process all the requests in the queue
      while (this.uploadQueue.length > 0) {
        const uploadQueueItem = this.uploadQueue.shift()!;
        await this.uploadAudioSegment(
          uploadQueueItem.segmentId,
          uploadQueueItem.audioDataBuffers,
        );
      }
    }
  }

  private async uploadAudioSegment(
    segmentId: number,
    audioDataBuffers: Uint8Array[],
  ) {
    console.log(`<Uploader> Uploading segment ${segmentId}`);
    const formData = new FormData();
    const audioBlob = new Blob(audioDataBuffers, {
      type: `audio/pcm;rate=${this.sampleRate}`,
    });
    formData.append("audio_data", audioBlob, "audio_data.pcm");

    try {
      const response = await fetch(
        `${this.uploadEndpointUrl}/${this.sessionId}/${segmentId}`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Upload successful:", result);
      } else {
        console.error("Upload failed:", response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }
}

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
      const mic = new Microphone();
      microphoneRef.current = mic;
      const uploader = new SegmentedAudioDataUploader(
        audioDataUploadUrl,
        uploadSegmentSizeSeconds,
      );
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
              (sampleRate, audioData) => {
                segmentedAudioDataUploaderRef.current?.addAudioDataBuffer(
                  sampleRate,
                  audioData,
                );
              },
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
