import { ErrorComponentProps } from "@tanstack/react-router";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { Trans, useTranslation } from "react-i18next";

import Footer from "@/components/Footer";

export const FallbackErrorPage = ({ error, reset }: ErrorComponentProps) => {
  const { t } = useTranslation();
  const [copiedText, copyToClipboard] = useCopyToClipboard();

  const errorText = `${error?.message || "unknown error"}\n${error?.stack || "no stack"}`;

  return (
    <>
      <div className="flex min-h-screen w-full flex-col justify-center">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">
              {t("grassy_funny_orangutan_arrive")}
            </h1>
            <div className="py-4">
              <Trans i18nKey="error_page_main_content">
                <span>error </span>
                <a className="link" type="email" href="mailto:yair@lifshitz.io">
                  let us know
                </a>
                <span>please </span>
              </Trans>
            </div>
            <div className="py-4">
              <p className="text-sm">{t("honest_super_thrush_dream")}</p>
            </div>
            <button className="btn btn-primary" onClick={() => reset()}>
              {t("keen_caring_bobcat_blend")}
            </button>
          </div>
        </div>

        <code
          dir="ltr"
          className="inset-2 m-4 max-h-28 overflow-auto border px-1 text-xs"
        >
          {errorText}
        </code>
        <button
          className="btn btn-outline mx-auto max-w-40"
          onClick={() => copyToClipboard(errorText)}
        >
          {copiedText ? t("fancy_clear_dingo_leap") : t("loose_raw_dingo_aim")}
        </button>
      </div>
      <Footer />
    </>
  );
};
