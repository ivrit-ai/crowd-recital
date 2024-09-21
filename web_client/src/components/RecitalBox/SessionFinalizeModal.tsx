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
  endSession: (sessionId: string) => void;
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
      <h1 className="text-xl">{t("aware_level_ocelot_pick")}</h1>
      <p>{t("brown_ninja_apple_dome")}</p>
      <p>{t("alpine_worm_veto_target")}</p>
      <div className="modal-action justify-end gap-2">
        <button
          className="btn btn-ghost btn-sm text-error"
          onClick={() => onDeleteSession()}
        >
          {progress ? (
            <span className="loading loading-infinity loading-xs" />
          ) : (
            <span>{t("seemly_teal_finch_comfort")}</span>
          )}
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onEndSession()}
          disabled={progress}
          autoFocus
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
