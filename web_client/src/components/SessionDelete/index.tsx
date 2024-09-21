import { ForwardedRef, forwardRef } from "react";
import { useTranslation } from "react-i18next";

export type ModalTexts = {
  title: string;
  description: string;
  deleteText: string;
  cancel: string;
};

type Props = {
  progress: boolean;
  onCancel: () => void;
  onDelete: () => void;
};

const ConfirmDeleteModal = (
  { progress, onDelete, onCancel }: Props,
  ref: ForwardedRef<HTMLDialogElement>,
) => {
  const { t } = useTranslation("recordings");
  return (
    <dialog className="modal" ref={ref} onClose={onCancel}>
      <div className="modal-box">
        <h1 className="text-xl">{t("these_keen_macaw_ask")}</h1>
        <p>{t("swift_tangy_racoon_leap")}</p>
        <div className="modal-action justify-end gap-2">
          <button
            className="btn btn-sm"
            onClick={() => onCancel()}
            disabled={progress}
          >
            {t("blue_pink_hawk_cook")}
          </button>
          <button className="btn btn-error btn-sm" onClick={() => onDelete()}>
            {progress ? (
              <span className="loading loading-infinity loading-xs" />
            ) : (
              <span>{t("pretty_low_mammoth_breathe")}</span>
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default forwardRef(ConfirmDeleteModal);
