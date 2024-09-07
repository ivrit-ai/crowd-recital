import { useCallback, useContext, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { LucideMenu, MicIcon } from "lucide-react";
import { twJoin } from "tailwind-merge";

import { UserContext } from "@/context/user";
import { RouteContext, Routes } from "@/context/route";
import { MicCheckContext } from "@/context/micCheck";
import ThemeModeSelector from "./ThemeModeSelector";

type HeaderMenuItemProps = {
  children: React.ReactNode;
  activeRoute?: Routes;
  goTo?: (route: Routes) => void;
  gotoRoute?: Routes;
};

const HeaderMenuItem = ({
  children,
  activeRoute,
  goTo,
  gotoRoute,
}: HeaderMenuItemProps) => (
  <li
    className={twJoin(
      "py-4 sm:py-0",
      !!activeRoute && activeRoute == gotoRoute && "font-bold",
    )}
    onClick={() => gotoRoute && goTo?.(gotoRoute)}
  >
    {children}
  </li>
);

const Header = () => {
  const posthog = usePostHog();
  const { user, logout } = useContext(UserContext);
  const { activeRoute, setActiveRoute } = useContext(RouteContext);
  const { setMicCheckActive } = useContext(MicCheckContext);
  const [imgError, setImgError] = useState(false);
  const menuButtonRef = useRef<HTMLUListElement>(null);
  const goTo = useCallback(
    (route: Routes) => {
      posthog?.capture("Navigate", { route });
      setActiveRoute(route);
      menuButtonRef.current?.blur();
    },
    [menuButtonRef, setActiveRoute],
  );

  if (!user) {
    return null; // Not expected
  }

  return (
    <header className="navbar sticky top-0 z-10 flex h-[--topbar-height] items-center gap-4 border-b bg-base-100 px-4 md:px-6">
      <a
        onClick={() => goTo(Routes.Recital)}
        className="flex-1 cursor-pointer select-none"
      >
        <span className="text-xl font-bold">עברית.ai</span>
      </a>
      <div className="flex flex-none items-stretch gap-5">
        <ThemeModeSelector />
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="avatar placeholder btn btn-circle btn-ghost"
          >
            <div className="placeholder w-10 rounded-full">
              {imgError ? (
                <LucideMenu />
              ) : (
                <img
                  alt="menu"
                  src={user.picture}
                  aria-hidden="true"
                  onError={() => setImgError(true)}
                />
              )}
            </div>
          </div>

          <ul
            tabIndex={0}
            ref={menuButtonRef}
            className="menu dropdown-content menu-sm z-[999] mt-3 w-44 rounded-box bg-base-100 p-2 shadow"
          >
            <li className="menu-title">{user.name}</li>
            {user.isAdmin() && (
              <HeaderMenuItem
                activeRoute={activeRoute}
                goTo={goTo}
                gotoRoute={Routes.Admin}
              >
                <a>ממשק ניהול</a>
              </HeaderMenuItem>
            )}
            <HeaderMenuItem>
              <a onClick={() => setMicCheckActive(true)}>
                בדיקת מיקרופון <MicIcon className="h-4 w-4" />
              </a>
            </HeaderMenuItem>
            <HeaderMenuItem
              activeRoute={activeRoute}
              goTo={goTo}
              gotoRoute={Routes.Recital}
            >
              <a>ממשק הקלטה</a>
            </HeaderMenuItem>
            <HeaderMenuItem
              activeRoute={activeRoute}
              goTo={goTo}
              gotoRoute={Routes.Sessions}
            >
              <a>הקלטות</a>
            </HeaderMenuItem>
            <HeaderMenuItem>
              <a onClick={() => logout()}>התנתק</a>
            </HeaderMenuItem>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;
