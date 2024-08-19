import { createContext } from "react";

import type { User } from "../../types/user";

type UserContextType = {
  user: User | null;
  logout: () => void;
};

const UserContext = createContext<UserContextType>({
  user: null,
  logout: () => {},
});

export { UserContext, type UserContextType };
