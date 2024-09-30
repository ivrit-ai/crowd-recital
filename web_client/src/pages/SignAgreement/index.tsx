import { useMutation, useQuery } from "@tanstack/react-query";
import { useIntersectionObserver } from "@uidotdev/usehooks";
import { useTranslation } from "react-i18next";

import useTrackPageView from "@/analytics/useTrackPageView";
import { getLoadEulaOptions } from "@/client/queries/staticContent";
import { signUserAgreement } from "@/client/user";
import CentredPage from "@/components/CenteredPage";

const SignAgreement = () => {
  useTrackPageView("signAgreement");
  const { t } = useTranslation();
  const data = useQuery(getLoadEulaOptions());
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

  return (
    <CentredPage>
      <div className="hero">
        <div className="hero-content h-screen-minus-topbar flex-col justify-start">
          <div className="text-center">
            <div className="text-4xl">📝👩‍⚖️🖊️</div>
            <h1 className="text-3xl">{t("last_heavy_bulldog_favor")}</h1>
            <p className="pt-6">{t("curly_lazy_manatee_wave")}</p>
          </div>
          <div className="grow basis-0 overflow-auto">
            <article className="prose">
              {!data.isPending && !!data.data ? (
                <>
                  <div dangerouslySetInnerHTML={{ __html: data.data }}></div>
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
