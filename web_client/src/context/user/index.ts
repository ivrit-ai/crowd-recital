import { createContext } from "react";

import type { User } from "../../types/user";

type UserContextType = {
  user: User | null;
  accessToken: string | null;
  logout: () => void;
};

const UserContext = createContext<UserContextType>({
  user: null,
  accessToken: null,
  logout: () => {},
});

export { UserContext, type UserContextType };
