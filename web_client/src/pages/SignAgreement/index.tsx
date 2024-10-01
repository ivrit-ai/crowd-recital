import { useMutation, useQuery } from "@tanstack/react-query";
import { useIntersectionObserver } from "@uidotdev/usehooks";
import { useTranslation } from "react-i18next";

import useTrackPageView from "@/analytics/useTrackPageView";
import { getLoadEulaOptions } from "@/client/queries/staticContent";
import { signUserAgreement } from "@/client/user";
import CentredPage from "@/components/CenteredPage";
import { useState } from "react";

const SignAgreement = () => {
  useTrackPageView("signAgreement");
  const { t } = useTranslation();
  const [licenseLang, setLicenseLang] = useState("en");
  const data_en = useQuery(getLoadEulaOptions("en"));
  const data_he = useQuery(getLoadEulaOptions("he"));
  const mutation = useMutation({
    mutationFn: signUserAgreement,
    onSettled: () => {
      // This should do for now. Refreshing the loaded user is complicated.
      document.location.reload();
    },
  });

  const [ref, entry] = useIntersectionObserver({
    threshold: 0,
    root: null,
    rootMargin: "50px",
  });

  const firstData = licenseLang === "en" ? data_en : data_he;
  const secondData = licenseLang === "en" ? data_he : data_en;
  const bothDataLoaded = !firstData.isPending && !secondData.isPending;

  return (
    <CentredPage>
      <div className="hero">
        <div className="hero-content h-screen-minus-topbar flex-col justify-start">
          <div className="text-center">
            <div className="text-4xl">👩‍⚖️🖊️</div>
            <h1 className="text-3xl">{t("last_heavy_bulldog_favor")}</h1>
            <p className="pt-6">{t("curly_lazy_manatee_wave")}</p>
            <label className="btn btn-outline swap mt-4">
              <input
                type="checkbox"
                checked={licenseLang === "en"}
                onChange={() =>
                  setLicenseLang(licenseLang === "en" ? "he" : "en")
                }
              />
              <div className="swap-on">English Version</div>
              <div className="swap-off">גרסה עברית</div>
            </label>
          </div>
          <div className="grow basis-0 overflow-auto">
            <article className="prose">
              {bothDataLoaded ? (
                <>
                  <div
                    dangerouslySetInnerHTML={{ __html: firstData.data! }}
                  ></div>
                  <div
                    dangerouslySetInnerHTML={{ __html: secondData.data! }}
                  ></div>
                  <div ref={ref}></div>
                </>
              ) : (
                <div className="loading loading-infinity loading-lg"></div>
              )}
            </article>
          </div>
          <div>
            {entry?.isIntersecting ? (
              <button
                className="btn btn-primary"
                onClick={() => mutation.mutate()}
              >
                {t("orange_fancy_stork_pop")}
              </button>
            ) : (
              <button disabled className="btn btn-primary">
                {t("trick_soft_toucan_wish")}
              </button>
            )}
          </div>
        </div>
      </div>
    </CentredPage>
  );
};

export default SignAgreement;
