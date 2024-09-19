import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { twJoin } from "tailwind-merge";

import { markSessionForDeletion } from "@/client/sessions";

type Props = {
  sessionId?: string;
  readyToFinalize: boolean;
  awaitingFinalization: boolean;
  setAwaitingFinalization: (awaiting: boolean) => void;
  endSession: (sessionId: string) => void;
};

const SessionFinalizeModal = ({
  sessionId,
  readyToFinalize,
  awaitingFinalization,
  setAwaitingFinalization,
  endSession,
}: Props) => {
  const [progress, setProgress] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: markSessionForDeletion,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({
        queryKey: ["session", sessionId],
      });
    },
  });

  const onEndSession = useCallback(() => {
    sessionId && endSession(sessionId);
    setAwaitingFinalization(false);
  }, [endSession, sessionId]);
  const onDeleteSession = useCallback(async () => {
    setProgress(true);
    sessionId && (await mutation.mutateAsync(sessionId));
    setProgress(false);
    setAwaitingFinalization(false);
  }, [sessionId]);

  const modalContent = readyToFinalize ? (
    <>
      <h1 className="text-xl">איך הלך?</h1>
      <p>במידה ומשהו בהקלטה לא הלך טוב, עדיף למחוק ולנסות שוב.</p>
      <p>אחרת, אפשר לשמור.</p>
      <div className="modal-action justify-end gap-2">
        <button
          className="btn btn-ghost btn-sm text-error"
          onClick={() => onDeleteSession()}
        >
          {progress ? (
            <span className="loading loading-infinity loading-xs" />
          ) : (
            <span>מחק</span>
          )}
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onEndSession()}
          disabled={progress}
          autoFocus
        >
          שמור
        </button>
      </div>
    </>
  ) : (
    <div className="text-center">
      <p>ההקלטה עדיין נשמרת - אנא המתן.</p>
      <div className="loading loading-infinity loading-lg" />
    </div>
  );

  return (
    <div className={twJoin("modal", awaitingFinalization && "modal-open")}>
      <div className="modal-box">{modalContent}</div>
    </div>
  );
};

export default SessionFinalizeModal;
