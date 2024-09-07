import { reportResponseError } from "@/analytics";
import { alterSessionBaseUrl } from "@/client/sessions";

type UploadQueueItem = {
  segmentId: number;
  audioDataBlob: Blob;
  mimeType: string;
};

class SegmentedAudioDataUploader extends EventTarget {
  private shuttingDown: boolean = false;
  private stopped: boolean = true;
  private nextSegmentId = 0;
  private uploadQueue: UploadQueueItem[] = [];
  private sessionId: string = "";
  private waitForUploadQueueToExit!: Promise<void>;
  private notifyUploadQueueHasExited!: (
    value: void | PromiseLike<void>,
  ) => void;
  private waitForPendingUploadTask!: Promise<void>;
  private notifyPendingUploaTask!: (value: void | PromiseLike<void>) => void;

  public async start(sessionId: string) {
    if (this.stopped) {
      this.sessionId = sessionId;
      this.stopped = false;
      this.shuttingDown = false;
      this.nextSegmentId = 0;

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
      this.notifyPendingUploaTask();
      await this.waitForUploadQueueToExit;
    }
  }

  public addAudioBlob(audioBlob: Blob, mimeType: string) {
    if (audioBlob.size === 0) {
      return;
    }

    if (this.shuttingDown || this.stopped) {
      return;
    }

    this.queueSegmentUpload(this.nextSegmentId, audioBlob, mimeType);
    this.nextSegmentId++;
  }

  private queueSegmentUpload(
    segmentId: number,
    audioBlob: Blob,
    mimeType: string,
  ) {
    const uploadQueueItem: UploadQueueItem = {
      segmentId,
      audioDataBlob: audioBlob,
      mimeType,
    };
    this.uploadQueue.push(uploadQueueItem);
    this.notifyPendingUploaTask();
  }

  private async processUploadQueue() {
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
          uploadQueueItem.audioDataBlob,
          uploadQueueItem.mimeType,
        );
      }
    }
  }

  private async uploadAudioSegment(
    segmentId: number,
    audioDataBlob: Blob,
    mimeType: string,
  ) {
    console.log(`<Uploader> Uploading segment ${segmentId}`);
    const formData = new FormData();

    const audioBlob = new Blob([audioDataBlob], {
      type: mimeType,
    });
    formData.append("audio_data", audioBlob);

    try {
      const response = await fetch(
        `${alterSessionBaseUrl}/${this.sessionId}/upload-audio-segment/${segmentId}`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const errorMessage = await reportResponseError(
          response,
          "uploader",
          "uploadAudioSegment",
          "Upload Segment Failed",
        );
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error:", error);
      this.dispatchEvent(
        new ErrorEvent("error", {
          error: error,
          message: "Error uploading audio segment",
        }),
      );
    }
  }
}

export { SegmentedAudioDataUploader };
