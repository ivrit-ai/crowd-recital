import { useContext } from "react";

import { UserContext } from "@/context/user";
import ThemeModeSelector from "./ThemeModeSelector";

const Header = () => {
  const { user, logout } = useContext(UserContext);

  if (!user) {
    return "no user";
  }

  return (
    <header className="bg-background sticky top-0 flex items-center gap-4 border-b px-4 md:px-6">
      <div className="navbar bg-base-100">
        <div className="flex-1">
          <span className="text-xl font-bold">עברית.ai</span>
        </div>
        <div className="flex-none gap-5">
          <ThemeModeSelector />
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar placeholder"
            >
              <div className="w-10 rounded-full">
                <img alt="user avatar" src={user.picture} />
              </div>
            </div>

            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-44 p-2 shadow"
            >
              <li className="menu-title">{user.name}</li>
              <li>
                <a onClick={() => logout()}>התנתק</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
