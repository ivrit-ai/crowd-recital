import { useCallback } from "react";

const upload = async (
  textDataUploadUrl: string,
  sessionId: string,
  recordingTimestamp: number,
  text: string,
) => {
  const response = await fetch(`${textDataUploadUrl}/${sessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      seek_end: recordingTimestamp,
      text,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to upload text segment");
  }
};

export function useTextSegmentUploader(
  sessionId: string,
  recordingTimestamp: number,
  textDataUploadUrl: string,
) {
  const uploadTextSegment = useCallback(
    async (text: string) => {
      await upload(textDataUploadUrl, sessionId, recordingTimestamp, text);
    },
    [sessionId, textDataUploadUrl, recordingTimestamp],
  );

  return [uploadTextSegment];
}
