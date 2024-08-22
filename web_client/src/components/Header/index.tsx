import { useContext } from "react";

import { UserContext } from "@/context/user";
import ThemeModeSelector from "./ThemeModeSelector";

const Header = () => {
  const { user, logout } = useContext(UserContext);

  if (!user) {
    return "no user";
  }

  return (
    <header className="navbar sticky top-0 flex h-[--topbar-height] items-center gap-4 border-b bg-base-100 px-4 md:px-6">
      <div className="flex-1 select-none">
        <span className="text-xl font-bold">עברית.ai</span>
      </div>
      <div className="flex-none gap-5">
        <ThemeModeSelector />
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="avatar placeholder btn btn-circle btn-ghost"
          >
            <div className="w-10 rounded-full">
              <img alt="user avatar" src={user.picture} />
            </div>
          </div>

          <ul
            tabIndex={0}
            className="menu dropdown-content menu-sm z-[1] mt-3 w-44 rounded-box bg-base-100 p-2 shadow"
          >
            <li className="menu-title">{user.name}</li>
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
