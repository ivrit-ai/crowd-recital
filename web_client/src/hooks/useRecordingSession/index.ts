import { useCallback } from "react";

export const useRecordingSession = (
  createNewSessionUrl: string,
  endSessionUrl: string,
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

  const endSession = useCallback(
    async (sessionId: string) => {
      const response = await fetch(`${endSessionUrl}/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to end session");
      }
    },
    [endSessionUrl],
  );

  return [createNewSession, endSession] as const;
};
