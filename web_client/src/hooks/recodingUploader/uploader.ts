type UploadQueueItem = {
  segmentId: number;
  audioDataBlob: Blob;
  mimeType: string;
};

class SegmentedAudioDataUploader {
  private shuttingDown: boolean = false;
  private stopped: boolean = true;
  private nextSegmentId = 0;
  private uploadQueue: UploadQueueItem[] = [];
  private uploadEndpointUrl: string;
  private sessionId: string = "";
  private waitForUploadQueueToExit!: Promise<void>;
  private notifyUploadQueueHasExited!: (
    value: void | PromiseLike<void>,
  ) => void;
  private waitForPendingUploadTask!: Promise<void>;
  private notifyPendingUploaTask!: (value: void | PromiseLike<void>) => void;

  constructor(uploadEndpointUrl: string) {
    this.uploadEndpointUrl = uploadEndpointUrl;
  }

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
    console.log(`<Uploader> Got audio Blob (${audioBlob.size}) [${mimeType}]`);

    if (audioBlob.size === 0) {
      console.log("<Uploader> Ignoring empty audio blob");
      return;
    }

    if (this.shuttingDown || this.stopped) {
      console.log("<Uploader> While Sutting down - ignoring");
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
    console.log("<Uploader> Queueing segment for upload");
    const uploadQueueItem: UploadQueueItem = {
      segmentId,
      audioDataBlob: audioBlob,
      mimeType,
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
          uploadQueueItem.audioDataBlob,
          uploadQueueItem.mimeType,
        );
      }
    }
    console.log(
      `<Uploader> Stopping upload queue processor for session ${this.sessionId}`,
    );
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
        `${this.uploadEndpointUrl}/${this.sessionId}/${segmentId}`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        console.error("Upload failed:", response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }
}

export { SegmentedAudioDataUploader };
