import { useQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import { MicIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { getSessionOptions } from "@/client/queries/sessions";
import { RecitalSessionStatus } from "@/types/session";
import { Document } from "@/models";
import HeaderUserStats from "./HeaderUserStats";
import SessionInfoBox from "./SessionInfoBox";

type Props = {
  sessionId: string;
  recording: boolean;
  document: Document;
};

const Header = ({ sessionId, recording, document }: Props) => {
  const { t } = useTranslation("recordings");
  const { mic } = useRouteContext({ strict: false });
  const { data: sessionData, isPending } = useQuery({
    ...getSessionOptions(sessionId),
    refetchInterval: !sessionId
      ? false
      : (query) => {
          const lastFetchedData = query.state.data;
          if (
            lastFetchedData?.status !== RecitalSessionStatus.Uploaded &&
            !lastFetchedData?.disavowed
          ) {
            return 2000;
          } else {
            return false;
          }
        },
  });

  return (
    <header className="bg-base-200 p-4">
      <div className="flex flex-row justify-between">
        <div className="mx-auto flex w-full max-w-4xl flex-col justify-center gap-2 md:flex-row md:items-center md:justify-around md:gap-4 md:px-6">
          <div className="min-w-0">
            <div className="text-sm font-bold md:text-lg">
              {t("fancy_smart_tadpole_slurp")}{" "}
              {!recording && (
                <Link
                  to="/documents"
                  className="btn btn-link btn-sm text-primary"
                >
                  {t("jumpy_long_racoon_hunt")}
                </Link>
              )}
            </div>
            <div className="truncate text-sm">{document.title}</div>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold md:text-lg">
              {t("every_inclusive_ape_endure")}{" "}
              {!recording && (
                <Link
                  className="btn btn-link btn-sm text-primary"
                  to="/sessions"
                >
                  {t("funny_glad_clownfish_drip")}
                </Link>
              )}
            </div>
            <div className="truncate text-sm">
              {recording ? (
                <span className="text-error">
                  {t("white_pretty_ostrich_bask")}
                </span>
              ) : (
                <SessionInfoBox
                  id={sessionId}
                  sessionData={sessionData}
                  isPending={isPending}
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <span
            className="btn btn-outline btn-sm sm:btn-xs"
            onClick={() => mic?.setMicCheckActive(true)}
          >
            {t("honest_sea_halibut_reap")}{" "}
            <MicIcon className="inline-block h-4 w-4" />
          </span>
        </div>
      </div>
      {!recording && (
        <div>
          <HeaderUserStats
            sessionId={sessionId}
            sessionStatus={sessionData?.status}
          />
        </div>
      )}
    </header>
  );
};

export default Header;
