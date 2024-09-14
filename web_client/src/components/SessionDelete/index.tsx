import { ForwardedRef, forwardRef } from "react";

export type ModalTexts = {
  title: string;
  description: string;
  deleteText: string;
  cancel: string;
};

const defaultTexts: ModalTexts = {
  title: "מחיקת הקלטה",
  description: "סמן הקלטה זו למחיקה? כל התוכן שהוקלט יימחק.",
  deleteText: "מחק",
  cancel: "ביטול",
};

type Props = {
  progress: boolean;
  onCancel: () => void;
  onDelete: () => void;
  texts?: Partial<ModalTexts>;
};

const ConfirmDeleteModal = (
  { progress, onDelete, onCancel, texts }: Props,
  ref: ForwardedRef<HTMLDialogElement>,
) => {
  const { title, description, deleteText, cancel } = {
    ...defaultTexts,
    ...texts,
  };
  return (
    <dialog className="modal" ref={ref} onClose={onCancel}>
      <div className="modal-box">
        <h1 className="text-xl">{title}</h1>
        <p>{description}</p>
        <div className="modal-action justify-end gap-2">
          <button
            className="btn btn-sm"
            onClick={() => onCancel()}
            disabled={progress}
          >
            {cancel}
          </button>
          <button className="btn btn-error btn-sm" onClick={() => onDelete()}>
            {progress ? (
              <span className="loading loading-infinity loading-xs" />
            ) : (
              <span>{deleteText}</span>
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default forwardRef(ConfirmDeleteModal);
