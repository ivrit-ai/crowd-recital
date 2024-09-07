import { useCallback, useEffect, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { Link2Off } from "lucide-react";
import { twJoin } from "tailwind-merge";

import { captureError } from "@/analytics";
import type { TabContentProps } from "./types";

interface Props extends TabContentProps {
  error: string | null;
  setError: (error: string) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  loadNewDocumentFromWikiArticle: (url: string) => Promise<void>;
}

const WikiArticleUpload = ({
  error,
  setError,
  loadNewDocumentFromWikiArticle,
}: Props) => {
  const posthog = usePostHog();
  const [wikiArticleUrl, setWikiArticleUrl] = useState("");
  const [validUrl, setValidUrl] = useState(false);

  useEffect(() => {
    setValidUrl(
      !wikiArticleUrl ||
        (URL.canParse(wikiArticleUrl) &&
          wikiArticleUrl.startsWith("https://he.wikipedia.org/wiki/")),
    );
  }, [wikiArticleUrl, setValidUrl]);

  const upload = useCallback(() => {
    if (validUrl) {
      loadNewDocumentFromWikiArticle(wikiArticleUrl).then(() => {
        setWikiArticleUrl("");
      });
      posthog?.capture("Upload Wiki URL", { wiki_url: wikiArticleUrl });
    } else {
      setError("זהו אינו קישור חוקי");
      posthog?.capture("Invalid Upload Wiki URL", { wiki_url: wikiArticleUrl });
    }
  }, [loadNewDocumentFromWikiArticle, wikiArticleUrl, validUrl]);

  return (
    <div className="flex flex-col justify-end gap-4">
      <label className="label">קישור למאמר ויקיפדיה</label>
      <div className="flex gap-2">
        <input
          type="url"
          dir="ltr"
          placeholder="לדוגמה https://he.wikipedia.org/wiki/פומפיי"
          className={twJoin(
            "input input-sm input-bordered w-full max-w-xl text-end",
            !validUrl && "input-error",
          )}
          value={wikiArticleUrl}
          onChange={(e) => setWikiArticleUrl(e.target.value)}
        />
        <button className="btn btn-primary btn-sm" onClick={upload}>
          המשך להקלטה
        </button>
      </div>
      <div className="divider"></div>

      {!!error && (
        <div role="alert" className="alert alert-error text-sm">
          <Link2Off /> {error}
        </div>
      )}
    </div>
  );
};

export default WikiArticleUpload;
