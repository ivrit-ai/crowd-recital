import { ForwardedRef, forwardRef } from "react";

type Props = {
  progress: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const ConfirmDeleteModal = (
  { progress, onConfirm, onClose }: Props,
  ref: ForwardedRef<HTMLDialogElement>,
) => {
  return (
    <dialog className="modal" ref={ref} onClose={onClose}>
      <div className="modal-box">
        <h1 className="text-xl">מחיקת הקלטה</h1>
        <p>סמן הקלטה זו למחיקה? כל התוכן שהוקלט יימחק.</p>
        <div className="modal-action justify-end gap-2">
          <button
            className="btn btn-sm"
            onClick={() => onClose()}
            disabled={progress}
          >
            ביטול
          </button>
          <button className="btn btn-error btn-sm" onClick={() => onConfirm()}>
            {progress ? (
              <span className="loading loading-infinity loading-xs" />
            ) : (
              <span>מחק</span>
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default forwardRef(ConfirmDeleteModal);
