import { useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link, MicIcon } from "lucide-react";

import { RecitalSessionStatus } from "@/types/session";
import HeaderUserStats from "./HeaderUserStats";
import SessionInfoBox from "./SessionInfoBox";
import { getSessionOptions } from "@/client/queries/sessions";

type Props = {
  sessionId: string;
  recording: boolean;
};

const Header = ({ sessionId, recording }: Props) => {
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
              מסמך טקסט{" "}
              {!recording && (
                <Link
                  to="/documents"
                  className="btn btn-link btn-sm text-primary"
                >
                  החלף
                </Link>
              )}
            </div>
            <div className="truncate text-sm">{document.title}</div>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold md:text-lg">
              סשן הקלטה{" "}
              {!recording && (
                <Link
                  className="btn btn-link btn-sm text-primary"
                  to="/sessions"
                >
                  הקלטות
                </Link>
              )}
            </div>
            <div className="truncate text-sm">
              {recording ? (
                <span className="text-error">מקליט</span>
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
            בדיקה <MicIcon className="inline-block h-4 w-4" />
          </span>
        </div>
      </div>
      <div>
        <HeaderUserStats
          sessionId={sessionId}
          sessionStatus={sessionData?.status}
        />
      </div>
    </header>
  );
};

export default Header;
