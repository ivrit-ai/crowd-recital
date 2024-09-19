import { useContext, useState } from "react";
import { LucideMenu, MedalIcon, MicIcon, TrophyIcon } from "lucide-react";
import { Link, ToOptions, useRouteContext } from "@tanstack/react-router";

import { UserContext } from "@/context/user";
import ThemeModeSelector from "./ThemeModeSelector";

type HeaderMenuItemProps = {
  children: React.ReactNode;
  closeMenu: () => void;
};

const HeaderMenuItem = ({ children, closeMenu }: HeaderMenuItemProps) => (
  <li className="py-4 sm:py-1" onClick={closeMenu}>
    {children}
  </li>
);

type HeaderMenuLinkProps = ToOptions & {
  children: React.ReactNode;
};

const HeaderMenuLink = ({ children, ...linkProps }: HeaderMenuLinkProps) => {
  return (
    <Link {...linkProps} activeProps={{ className: "font-bold" }}>
      {children}
    </Link>
  );
};

const Header = () => {
  const { mic } = useRouteContext({ strict: false });
  const { auth, logout } = useContext(UserContext);
  const [imgError, setImgError] = useState(false);

  const closeMenu = () => {
    const elem = document.activeElement;
    if (elem) {
      (elem as HTMLElement).blur();
    }
  };

  if (!auth?.user) {
    return null; // Not expected
  }

  return (
    <header className="navbar sticky top-0 z-10 flex h-[--topbar-height] items-center gap-4 border-b bg-base-100 px-4 md:px-6">
      <Link to="/" className="flex-1 cursor-pointer select-none">
        <span className="text-xl font-bold">עברית.ai</span>
      </Link>
      <div className="flex flex-none items-stretch gap-5">
        <ThemeModeSelector />
        <div className="dropdown dropdown-end" tabIndex={0}>
          <div
            role="button"
            className="avatar placeholder btn btn-circle btn-ghost"
          >
            <div className="placeholder w-10 rounded-full">
              {imgError ? (
                <LucideMenu />
              ) : (
                <img
                  alt="menu"
                  src={auth.user.picture}
                  aria-hidden="true"
                  onError={() => setImgError(true)}
                />
              )}
            </div>
          </div>

          <ul
            tabIndex={0}
            className="menu dropdown-content menu-sm z-[999] mt-3 w-44 rounded-box bg-base-100 p-2 shadow"
          >
            <li className="menu-title">{auth.user.name}</li>
            {/* {auth.user.isAdmin() && (
              <HeaderMenuItem
                activeRoute={activeRoute}
                goTo={goTo}
                gotoRoute={Routes.Admin}
              >
                <a>ממשק ניהול</a>
              </HeaderMenuItem>
            )} */}
            <HeaderMenuItem closeMenu={closeMenu}>
              <a onClick={() => mic?.setMicCheckActive(true)}>
                בדיקת מיקרופון <MicIcon className="h-4 w-4" />
              </a>
            </HeaderMenuItem>
            <HeaderMenuItem closeMenu={closeMenu}>
              <HeaderMenuLink to="/documents">ממשק הקלטה</HeaderMenuLink>
            </HeaderMenuItem>
            <HeaderMenuItem closeMenu={closeMenu}>
              <HeaderMenuLink to="/sessions">רשימת הקלטות</HeaderMenuLink>
            </HeaderMenuItem>
            <HeaderMenuItem closeMenu={closeMenu}>
              <HeaderMenuLink to="/leaderboard">
                היכל התהילה <TrophyIcon className="h-4 w-4" />
              </HeaderMenuLink>
            </HeaderMenuItem>
            <HeaderMenuItem closeMenu={closeMenu}>
              <a onClick={() => logout()}>התנתק</a>
            </HeaderMenuItem>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;
