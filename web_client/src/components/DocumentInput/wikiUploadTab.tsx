import { Link2Off } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { twJoin } from "tailwind-merge";

import type { TabContentProps } from "./types";

interface Props extends TabContentProps {
  error: string | null;
  setError: (error: string) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  loadNewDocumentFromWikiArticle: (url: string) => Promise<void>;
}

const allowedWikiLangs = ["he", "yi"];
const allowedWikiUrlPattern = new RegExp(
  `^https://([a-z]+)(.m)?\\.wikipedia\\.org/wiki/`,
  "i",
);

console.log(
  allowedWikiUrlPattern.exec(
    "https://yi.m.wikipedia.org/wiki/%D7%A7%D7%90%D6%B7%D7%98%D7%A2%D7%92%D7%90%D6%B8%D7%A8%D7%99%D7%A2:%D7%A7%D7%90%D6%B8%D7%95%D7%95%D7%99%D7%93-19",
  ),
);

const WikiArticleUpload = ({
  error,
  setError,
  loadNewDocumentFromWikiArticle,
}: Props) => {
  const { t } = useTranslation("documents");
  const posthog = usePostHog();
  const [wikiArticleUrl, setWikiArticleUrl] = useState("");
  const [validUrl, setValidUrl] = useState(false);
  const [invalidUrlReason, setInvalidUrlReason] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const emptyUrl = !wikiArticleUrl;
    const parsableUrl = URL.canParse(wikiArticleUrl);
    const aWikiArticleUrl = allowedWikiUrlPattern.test(wikiArticleUrl);
    let supportedLang = true;
    if (aWikiArticleUrl) {
      const lang = allowedWikiUrlPattern.exec(wikiArticleUrl)?.[1];
      if (lang && !allowedWikiLangs.includes(lang)) {
        supportedLang = false;
      }
    }
    const validUrl =
      emptyUrl || (parsableUrl && aWikiArticleUrl && supportedLang);
    setValidUrl(validUrl);
    if (!validUrl) {
      if (!parsableUrl) {
        setInvalidUrlReason(t("many_mushy_scallop_gasp"));
      } else if (!aWikiArticleUrl) {
        setInvalidUrlReason(t("tangy_fuzzy_pug_pat"));
      } else if (!supportedLang) {
        setInvalidUrlReason(t("sweet_swift_chipmunk_foster"));
      }
    }
  }, [wikiArticleUrl, setValidUrl]);

  const upload = useCallback(() => {
    if (validUrl) {
      setUploading(true);
      loadNewDocumentFromWikiArticle(wikiArticleUrl)
        .then(() => {
          setWikiArticleUrl("");
        })
        .finally(() => {
          setUploading(false);
        });
      posthog?.capture("Upload Wiki URL", { wiki_url: wikiArticleUrl });
    } else {
      setError(invalidUrlReason);
      posthog?.capture("Invalid Upload Wiki URL", { wiki_url: wikiArticleUrl });
    }
  }, [
    loadNewDocumentFromWikiArticle,
    wikiArticleUrl,
    validUrl,
    invalidUrlReason,
  ]);

  useEffect(() => {
    if (wikiArticleUrl) setError("");
  }, [wikiArticleUrl]);

  return (
    <div className="flex flex-col justify-end gap-4">
      <label className="label">{t("plane_merry_mallard_cut")}</label>
      <div className="flex gap-2">
        <input
          type="url"
          dir="ltr"
          placeholder={t("smart_shy_impala_assure")}
          className={twJoin(
            "input input-sm input-bordered w-full max-w-xl text-end",
            !validUrl && "input-error",
          )}
          value={wikiArticleUrl}
          onChange={(e) => setWikiArticleUrl(e.target.value)}
        />
        <button
          disabled={uploading}
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
      </div>

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

export default WikiArticleUpload;
