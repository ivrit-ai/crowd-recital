import { useCallback } from "react";

import { reportResponseError } from "@/analytics";

const createNewSessionUrl = "/api/sessions/new-recital-session";
const endSessionUrl = "/api/sessions/end-recital-session";

export const useRecordingSession = (documentId?: string) => {
  const createNewSession = useCallback(async () => {
    const response = await fetch(createNewSessionUrl, {
      method: "PUT",
      body: JSON.stringify({ document_id: documentId }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorMessage = await reportResponseError(
        response,
        "session",
        "createNewSession",
        "Failed to create new session",
      );
      throw new Error(errorMessage);
    }

    const { session_id } = await response.json();
    return session_id as string;
  }, [documentId]);

  const endSession = useCallback(async (sessionId: string) => {
    const response = await fetch(`${endSessionUrl}/${sessionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorMessage = await reportResponseError(
        response,
        "session",
        "endSession",
        "Failed to end session",
      );
      throw new Error(errorMessage);
    }
  }, []);

  return [createNewSession, endSession] as const;
};
