import { useCallback, useState } from "react";

import { reportResponseError } from "@/analytics";

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
    const errorMessage = await reportResponseError(
      response,
      "uploader",
      "uploadTextSegment",
      "Failed to upload text segment",
    );
    throw new Error(errorMessage);
  }
};

export function useTextSegmentUploader(
  sessionId: string,
  recordingTimestamp: number,
  textDataUploadUrl: string,
) {
  const [uploaderError, setUploaderError] = useState<Error | null>(null);
  const clearUploaderError = useCallback(() => setUploaderError(null), []);
  const uploadTextSegment = useCallback(
    async (text: string) => {
      if (uploaderError) return; // Wait for a clear before trying again

      try {
        await upload(textDataUploadUrl, sessionId, recordingTimestamp, text);
      } catch (err) {
        console.error(err);
        setUploaderError(err as Error);
      }
    },
    [sessionId, uploaderError, textDataUploadUrl, recordingTimestamp],
  );

  return { uploadTextSegment, uploaderError, clearUploaderError };
}
