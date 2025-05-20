import { Link2Off } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { twJoin } from "tailwind-merge";

import type { TabContentProps } from "./types";
import {
  SuggestedWikiArticle,
  suggestWikiArticle,
  WikiArticleLang,
} from "@/client/documents";

interface Props extends TabContentProps {
  error: string | null;
  setError: (error: string) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  loadNewDocumentFromWikiArticle: (url: string) => Promise<void>;
}

const allowedWikiLangs = [
  WikiArticleLang.Hebrew as string,
  WikiArticleLang.Yiddish as string,
];
const allowedWikiUrlPattern = new RegExp(
  `^https://([a-z]+)(.m)?(\\.wikipedia\\.org|\\.hamichlol\\.org\\.il)(/wiki)?/(.+)$`,
  "i",
);

const WikiArticleUpload = ({
  error,
  setError,
  loadNewDocumentFromWikiArticle,
}: Props) => {
  const { t, i18n } = useTranslation("documents");
  const posthog = usePostHog();
  const [wikiArticleUrl, setWikiArticleUrl] = useState("");
  const [validUrl, setValidUrl] = useState(false);
  const [invalidUrlReason, setInvalidUrlReason] = useState("");
  const [suggestedArticle, setSuggestedArticle] =
    useState<SuggestedWikiArticle | null>(null);
  const [suggesting, setSuggesting] = useState(false);
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

  const suggest = useCallback(async () => {
    try {
      setSuggesting(true);
      setError("");
      const suggested = await suggestWikiArticle(
        i18n.language as WikiArticleLang,
      );
      setSuggestedArticle(suggested);
    } catch (err) {
      setError("Wiki suggestions failed.");
    } finally {
      setSuggesting(false);
    }
  }, [i18n.language]);

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

  const uploadSuggested = useCallback(() => {
    if (suggestedArticle) {
      setUploading(true);
      loadNewDocumentFromWikiArticle(suggestedArticle.url)
        .then(() => {
          setSuggestedArticle(null);
        })
        .finally(() => {
          setUploading(false);
        });
      posthog?.capture("Upload Suggested Wiki", {
        wiki_url: suggestedArticle.title,
      });
    }
  }, [loadNewDocumentFromWikiArticle, suggestedArticle]);

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

      <label className="label">{t("major_brief_fly_approve")}</label>

      {!suggestedArticle && !suggesting ? (
        <div className="flex gap-2">
          <button
            disabled={uploading}
            className={twJoin("btn btn-primary btn-sm")}
            onClick={suggest}
          >
            {t("inner_cuddly_nuthatch_care")}
          </button>
        </div>
      ) : suggesting ? (
        <div className="flex justify-center">
          <span className="loading loading-infinity loading-lg min-h-32 px-4" />
        </div>
      ) : (
        <div>
          <div>
            <h3 className="text-md font-bold">{suggestedArticle?.title}</h3>
          </div>
          <div className="flex justify-between">
            <p>{suggestedArticle?.extract}</p>
            <div className="ms-5 hidden grow-0 basis-1/5 sm:block">
              <img
                className="object-cover"
                src={suggestedArticle?.thumbnail.source}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              disabled={uploading}
              className={twJoin("btn btn-outline btn-sm")}
              onClick={suggest}
            >
              {t("tough_stock_crocodile_foster")}
            </button>
            <button
              disabled={uploading}
              className={twJoin("btn btn-primary btn-sm")}
              onClick={uploadSuggested}
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
        </div>
      )}

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
