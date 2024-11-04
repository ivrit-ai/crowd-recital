import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { twJoin } from "tailwind-merge";

import { markSessionForDeletion } from "@/client/sessions";

type Props = {
  sessionId?: string;
  readyToFinalize: boolean;
  awaitingFinalization: boolean;
  setAwaitingFinalization: (awaiting: boolean) => void;
  endSession: (sessionId: string, discardLastNTextSegments: number) => void;
};

const SessionFinalizeModal = ({
  sessionId,
  readyToFinalize,
  awaitingFinalization,
  setAwaitingFinalization,
  endSession,
}: Props) => {
  const { t } = useTranslation("recordings");
  const [progress, setProgress] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: markSessionForDeletion,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({
        queryKey: ["session", sessionId],
      });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const onEndSession = useCallback(
    (discardLastNTextSegments: number) => {
      sessionId && endSession(sessionId, discardLastNTextSegments);
      setAwaitingFinalization(false);
    },
    [endSession, sessionId],
  );
  const onDeleteSession = useCallback(async () => {
    setProgress(true);
    sessionId && (await mutation.mutateAsync(sessionId));
    setProgress(false);
    setAwaitingFinalization(false);
  }, [sessionId]);

  const modalContent = readyToFinalize ? (
    <>
      <h1 className="text-xl">{t("aware_level_ocelot_pick")}</h1>
      <p>{t("brown_ninja_apple_dome")}</p>
      <p>{t("alpine_worm_veto_target")}</p>
      <div className="modal-action justify-end gap-2">
        <button
          className="btn btn-ghost btn-sm text-error"
          onClick={() => onDeleteSession()}
          tabIndex={3}
        >
          {progress ? (
            <span className="loading loading-infinity loading-xs" />
          ) : (
            <span>{t("seemly_teal_finch_comfort")}</span>
          )}
        </button>
        <button
          className="btn btn-accent btn-sm"
          onClick={() => onEndSession(1)}
          disabled={progress}
          tabIndex={2}
        >
          {t("quick_nice_iguana_fetch")}
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onEndSession(0)}
          disabled={progress}
          autoFocus
          tabIndex={1}
        >
          {t("frail_fluffy_loris_scold")}
        </button>
      </div>
    </>
  ) : (
    <div className="text-center">
      <p>{t("strong_kind_toucan_lock")}</p>
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
