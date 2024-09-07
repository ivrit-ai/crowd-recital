import { useCallback, useEffect, useRef, useState } from "react";

export default function () {
  const sessionPreviewRef = useRef<HTMLDialogElement>(null);
  const [previewedSessionId, setPreviewedSessionId] = useState<string>("");
  useEffect(() => {
    if (previewedSessionId) {
      sessionPreviewRef.current?.showModal();
    }
    return () => {
      sessionPreviewRef.current?.close();
    };
  }, [previewedSessionId]);
  const onClose = useCallback(() => setPreviewedSessionId(""), []);

  return [
    sessionPreviewRef,
    previewedSessionId,
    setPreviewedSessionId,
    onClose,
  ] as const;
}
