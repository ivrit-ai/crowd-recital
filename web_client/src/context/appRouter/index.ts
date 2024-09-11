import type { AuthState } from "@/context/user";
import type { QueryClient } from "@tanstack/react-query";

type MicCheck = {
  micCheckActive: boolean;
  setMicCheckActive: (active: boolean) => void;
};

export interface AppRouterContext {
  queryClient: QueryClient;
  auth: AuthState;
  mic: MicCheck;
}
