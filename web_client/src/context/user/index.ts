import { createContext } from "react";

import type { User } from "@/types/user";
import type { GoogleLoginProps } from "@/hooks/useLogin";

type AuthState = {
  user: User | null;
  accessToken: string | null;
};

type UserContextType = {
  auth: AuthState;
  logout: () => void;
  googleLoginProps: GoogleLoginProps;
};

const UserContext = createContext<UserContextType>({
  auth: undefined!,
  logout: () => {},
  googleLoginProps: { onCredential: () => {} },
});

export { UserContext, type UserContextType, type AuthState };
