import { Link, ToOptions, useRouteContext } from "@tanstack/react-router";
import {
  HelpCircleIcon,
  LanguagesIcon,
  LucideMenu,
  MicIcon,
  TrophyIcon,
} from "lucide-react";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";

import { UserContext } from "@/context/user";
import HeaderGuide from "./HeaderGuide";
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
  const { t, i18n } = useTranslation();
  const { mic } = useRouteContext({ strict: false });
  const { auth, logout } = useContext(UserContext);
  const [imgError, setImgError] = useState(false);

  const closeMenu = () => {
    const elem = document.activeElement;
    if (elem) {
      (elem as HTMLElement).blur();
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (!auth?.user) {
    return null; // Not expected
  }

  const agreementSigned = auth.user.didSignAgreement();
  const isSpeaker = auth.user.isSpaker();

  return (
    <>
      <header className="navbar sticky top-0 z-10 flex h-[--topbar-height] items-center gap-4 border-b bg-base-100 px-4 md:px-6">
        <Link to="/" className="flex-1 cursor-pointer select-none">
          <span className="text-xl font-bold">עברית.ai</span>
        </Link>
        <div className="flex flex-none items-stretch gap-5">
          <div className="flex items-center">
            <Link to="/help">
              <HelpCircleIcon />
            </Link>
          </div>
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
              {auth.user.isAdmin() && (
                <HeaderMenuItem closeMenu={closeMenu}>
                  {i18n.language !== "yi" && (
                    <button type="button" onClick={() => changeLanguage("yi")}>
                      יידיש <LanguagesIcon className="h-4 w-4" />
                    </button>
                  )}
                  {i18n.language !== "he" && (
                    <button type="button" onClick={() => changeLanguage("he")}>
                      עבר <LanguagesIcon className="h-4 w-4" />
                    </button>
                  )}
                </HeaderMenuItem>
              )}
              <HeaderMenuItem closeMenu={closeMenu}>
                <a onClick={() => mic?.setMicCheckActive(true)}>
                  {t("tiny_soft_whale_dazzle")} <MicIcon className="h-4 w-4" />
                </a>
              </HeaderMenuItem>
              {isSpeaker && (
                <HeaderMenuItem closeMenu={closeMenu}>
                  <HeaderMenuLink to="/documents">
                    {t("silly_super_lemur_forgive")}
                  </HeaderMenuLink>
                </HeaderMenuItem>
              )}
              {isSpeaker && (
                <HeaderMenuItem closeMenu={closeMenu}>
                  <HeaderMenuLink to="/sessions">
                    {t("weak_lost_dingo_value")}
                  </HeaderMenuLink>
                </HeaderMenuItem>
              )}
              <HeaderMenuItem closeMenu={closeMenu}>
                <HeaderMenuLink to="/leaderboard">
                  {t("brief_sharp_boar_pout")}{" "}
                  <TrophyIcon className="h-4 w-4" />
                </HeaderMenuLink>
              </HeaderMenuItem>
              <HeaderMenuItem closeMenu={closeMenu}>
                <a onClick={() => logout()}>{t("sleek_keen_crow_zap")}</a>
              </HeaderMenuItem>
            </ul>
          </div>
        </div>
      </header>
      {agreementSigned && <HeaderGuide />}
    </>
  );
};

export default Header;
