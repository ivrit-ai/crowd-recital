import { useCallback, useContext, useRef, useState } from "react";

import { UserContext } from "@/context/user";
import { RouteContext, Routes } from "@/context/route";
import ThemeModeSelector from "./ThemeModeSelector";
import { LucideMenu } from "lucide-react";

const Header = () => {
  const { user, logout } = useContext(UserContext);
  const { activeRoute, setActiveRoute } = useContext(RouteContext);
  const [imgError, setImgError] = useState(false);
  const menuButtonRef = useRef<HTMLUListElement>(null);
  const goTo = useCallback(
    (route: Routes) => {
      setActiveRoute(route);
      menuButtonRef.current?.blur();
    },
    [menuButtonRef, setActiveRoute],
  );

  if (!user) {
    return null; // Not expected
  }

  return (
    <header className="navbar sticky top-0 flex h-[--topbar-height] items-center gap-4 border-b bg-base-100 px-4 md:px-6">
      <div className="flex-1 select-none">
        <span className="text-xl font-bold">עברית.ai</span>
      </div>
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
            className="menu dropdown-content menu-sm z-[1] mt-3 w-44 rounded-box bg-base-100 p-2 shadow"
          >
            <li className="menu-title">{user.name}</li>
            {user.isAdmin() && activeRoute === Routes.Recital && (
              <li>
                <a onClick={() => goTo(Routes.Admin)}>ממשק ניהול</a>
              </li>
            )}
            {user.isAdmin() && activeRoute === Routes.Admin && (
              <li>
                <a onClick={() => goTo(Routes.Recital)}>ממשק הקלטה</a>
              </li>
            )}
            <li>
              <a onClick={() => logout()}>התנתק</a>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;
