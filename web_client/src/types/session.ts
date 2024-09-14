import type { DocumentType } from "./document";

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
  document: DocumentType;
  status: RecitalSessionStatus;
  disavowed: boolean;
};

class RecitalSession implements RecitalSessionType {
  id: string;
  created_at: string;
  updated_at: string;
  document: DocumentType;
  status: RecitalSessionStatus;
  disavowed: boolean;
  constructor(session: RecitalSessionType) {
    this.id = session.id;
    this.created_at = session.created_at;
    this.updated_at = session.updated_at;
    this.document = session.document;
    this.status = session.status;
    this.disavowed = session.disavowed;
  }
}

export type RecitalPreviewType = {
  id: string;
  audio_url: string;
  transcript_url: string;
};

export { type RecitalSessionType, RecitalSession, RecitalSessionStatus };
