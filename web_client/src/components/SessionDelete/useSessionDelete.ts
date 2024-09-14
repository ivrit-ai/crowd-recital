import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { markSessionForDeletion } from "@/client/sessions";

export default function () {
  const queryClient = useQueryClient();
  const [toDeleteSessionId, setToDeleteSessionId] = useState<string>("");
  const mutation = useMutation({
    mutationFn: markSessionForDeletion,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({
        queryKey: ["session", toDeleteSessionId],
      });
    },
  });
  const deleteConfirmRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (toDeleteSessionId) {
      deleteConfirmRef.current?.showModal();
    }
    return () => {
      deleteConfirmRef.current?.close();
    };
  }, [toDeleteSessionId]);
  const onDelete = useCallback(async () => {
    if (toDeleteSessionId) {
      await mutation.mutateAsync(toDeleteSessionId);

      setToDeleteSessionId("");
    }
  }, [toDeleteSessionId]);
  const onCancel = useCallback(() => {
    setToDeleteSessionId("");
  }, []);

  return [
    deleteConfirmRef,
    setToDeleteSessionId,
    onDelete,
    onCancel,
    mutation.isPending,
  ] as const;
}
