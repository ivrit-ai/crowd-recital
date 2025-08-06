import { Link2Off } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { twJoin } from "tailwind-merge";

import type { TabContentProps } from "./types";

interface Props extends TabContentProps {
  error: string | null;
  setError: (error: string) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  loadNewDocumentFromFreeText: (text: string, title?: string, lang?: string) => Promise<void>;
}

const FreeTextUpload = ({ error, loadNewDocumentFromFreeText }: Props) => {
  const { t } = useTranslation("documents");
  const posthog = usePostHog();
  const [freeText, setFreeText] = useState("");
  const [freeTextTitle, setFreeTextTitle] = useState<string | undefined>();
  const [freeTextLang, setFreeTextLang] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(() => {
    setUploading(true);
    loadNewDocumentFromFreeText(freeText, freeTextTitle, freeTextLang)
      .then(() => {
        setFreeText("");
      })
      .finally(() => {
        setUploading(false);
      });
    posthog?.capture("Upload Free Text");
  }, [loadNewDocumentFromFreeText, freeText, freeTextTitle, freeTextLang]);

  return (
    <div className="flex flex-col items-end gap-4">
      <select
        className="select select-bordered w-full"
        value={freeTextLang}
        onChange={(e) => setFreeTextLang(e.target.value)}
      >
        <option value="he">{t("he", { ns: "translation" })}</option>
        <option value="yi">{t("yi", { ns: "translation" })}</option>
      </select>
      <input
        className="input input-bordered w-full"
        placeholder={t("muddy_only_swallow_surge")}
        value={freeTextTitle}
        onChange={(e) => setFreeTextTitle(e.target.value)}
      />
      <textarea
        className="textarea textarea-bordered textarea-lg w-full"
        value={freeText}
        onChange={(e) => setFreeText(e.target.value)}
      ></textarea>
      <button
        disabled={uploading || !freeText.trim()}
        className={twJoin("btn btn-primary btn-sm")}
        onClick={upload}
      >
        {uploading ? (
          <span className="flex items-center">
            {t("fancy_tame_grizzly_renew")}
            <span className="loading loading-infinity loading-xs px-4" />
          </span>
        ) : (
          <span>{t("warm_next_alligator_laugh")}</span>
        )}
      </button>

      {!!error && (
        <div role="alert" className="alert alert-error text-sm">
          <span>
            <Link2Off />
          </span>{" "}
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FreeTextUpload;
