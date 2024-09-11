import type { AuthState } from "@/context/user";
import type { QueryClient } from "@tanstack/react-query";

export interface AppRouterContext {
  queryClient: QueryClient;
  auth: AuthState;
}
