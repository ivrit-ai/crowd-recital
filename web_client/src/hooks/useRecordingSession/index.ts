import { useCallback } from "react";

export const useRecordingSession = (
  createNewSessionUrl: string,
  documentId?: string,
) => {
  const createNewSession = useCallback(async () => {
    const response = await fetch(createNewSessionUrl, {
      method: "PUT",
      body: JSON.stringify({ document_id: documentId }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to create new session");
    }

    const { session_id } = await response.json();
    return session_id as string;
  }, [documentId, createNewSessionUrl]);

  return [createNewSession];
};
