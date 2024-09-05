// Content types we want to capture into - in desc priority
// Grab the one that is supported
const targetRecordingMediaTypes = [
  "audio/webm;codecs=opus",
  "audio/mp4;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

let targetRecordingMediaType: string | undefined = undefined;
for (const targetRecordingMediaTypeToConsider of targetRecordingMediaTypes) {
  if (MediaRecorder.isTypeSupported(targetRecordingMediaTypeToConsider)) {
    targetRecordingMediaType = targetRecordingMediaTypeToConsider;
    break;
  }
}
console.log("Using media type", targetRecordingMediaType || "default");

class Microphone extends EventTarget {
  private audioSegmentLengthSec: number;
  private createAnalyzer: boolean;
  private analyzer: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private audioContext?: AudioContext;
  private mediaRecorder?: MediaRecorder;
  private waitForMediaRecorderStop!: Promise<void>;
  private notifyMediaRecorderStopped!: (
    value: void | PromiseLike<void>,
  ) => void;
  private source?: MediaStreamAudioSourceNode;
  private timestampNotifierIntervalId?: NodeJS.Timeout;
  private recording: boolean = false;
  private stopping: boolean = false;

  constructor(
    audioSegmentLength: number = 30,
    createAnalyzer: boolean = false,
  ) {
    super();
    this.audioSegmentLengthSec = audioSegmentLength;
    this.createAnalyzer = createAnalyzer;
  }

  public isRecording() {
    return this.recording;
  }

  async requestPermission() {
    console.log("Requesting access...");
    if (!this.stream) {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      console.log("got it.");
    }
  }

  async startRecording(
    onAudioCallback: ((audioData: Blob, mimeType: string) => void) | null,
  ) {
    if (this.recording || this.stopping) return;

    if (!this.stream) {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
    }

    console.log("startRecording()");

    this.recording = true;

    // Create the new audio context
    this.audioContext = new AudioContext({
      latencyHint: "interactive",
    });

    // Create the nodes
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    if (this.createAnalyzer) {
      this.analyzer = this.audioContext.createAnalyser();
      this.analyzer.fftSize = 256;
      this.source.connect(this.analyzer);
    }
    const dest = this.audioContext.createMediaStreamDestination();
    dest.channelCount = 1; // We record mono speaking
    this.mediaRecorder = new MediaRecorder(dest.stream, {
      mimeType: targetRecordingMediaType,
    });

    // Start recording from the (not connected yet) output stream
    this.waitForMediaRecorderStop = new Promise<void>((resolve) => {
      this.notifyMediaRecorderStopped = resolve;
    });
    if (this.audioSegmentLengthSec > 0) {
      this.mediaRecorder.start(this.audioSegmentLengthSec * 1000);
    } else {
      // No slicing
      this.mediaRecorder.start();
    }
    const mediaRecoderMimeType = this.mediaRecorder.mimeType;

    // Connect nodes
    this.source.connect(dest);

    this.mediaRecorder.ondataavailable = (evt) => {
      if (onAudioCallback) onAudioCallback(evt.data, mediaRecoderMimeType);
    };

    this.mediaRecorder.onstop = () => {
      console.log("mediarecorder-on stop");
      this.notifyMediaRecorderStopped();
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

    // Stop the source - no more audio should be captured
    this.stream?.getTracks().forEach((track) => track.stop());

    // Make sure the recorder dumps any remaining data as a blob
    this.mediaRecorder?.stop();

    // Stop the recording time events
    clearInterval(this.timestampNotifierIntervalId);

    // Wait until the audio context stops
    await this.audioContext?.close();

    // Ensure all blobs are dumped into the uploader callback before
    // Stop is assumed to be complete
    await this.waitForMediaRecorderStop;

    this.stream = null;
    this.recording = false;
    this.analyzer = null;
    console.log("stopRecording()-Done.");
    this.stopping = false;
  }

  public getCurrentTime() {
    return this.audioContext?.currentTime;
  }

  public getAnalyser() {
    return this.analyzer;
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
}

export { Microphone };
