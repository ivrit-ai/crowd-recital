import { useCallback } from "react";

import { reportResponseError } from "@/analytics";
import { alterSessionBaseUrl } from "@/client/sessions";

export const useRecordingSession = (documentId?: string) => {
  const createNewSession = useCallback(async () => {
    const response = await fetch(alterSessionBaseUrl, {
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

  const endSession = useCallback(
    async (sessionId: string, discardLastNTextSegments: number = 0) => {
      const response = await fetch(`${alterSessionBaseUrl}/${sessionId}/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discard_last_n_text_segments: discardLastNTextSegments,
        }),
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
    },
    [],
  );

  return [createNewSession, endSession] as const;
};
