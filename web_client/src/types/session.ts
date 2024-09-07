enum RecitalSessionStatus {
  Active = "active",
  Ended = "ended",
  Aggregated = "aggregated",
  Uploaded = "uploaded",
  Discarded = "discarded",
}

type RecitalSessionType = {
  id: string;
  created_at: string;
  updated_at: string;
  document_id: string;
  document_title: string | undefined;
  status: RecitalSessionStatus;
};

class RecitalSession implements RecitalSessionType {
  id: string;
  created_at: string;
  updated_at: string;
  document_id: string;
  document_title: string | undefined;
  status: RecitalSessionStatus;
  constructor(sesssion: RecitalSessionType) {
    this.id = sesssion.id;
    this.created_at = sesssion.created_at;
    this.updated_at = sesssion.updated_at;
    this.document_id = sesssion.document_id;
    this.document_title = sesssion.document_title;
    this.status = sesssion.status;
  }
}

export type RecitalPreviewType = {
  id: string;
  audio_url: string;
  transcript_url: string;
};

export { type RecitalSessionType, RecitalSession, RecitalSessionStatus };
