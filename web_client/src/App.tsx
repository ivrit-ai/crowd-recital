import { useCallback, useContext, useState } from "react";
import { PostHogProvider } from "posthog-js/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { router } from "./router";
import { getPosthogClient } from "@/analytics";
import { withTrackedErrorBoundary } from "@/analytics/TrackedErrorBoundary";
import { UserContext } from "@/context/user";
import { MicCheckContext } from "./context/micCheck";
import useLogin from "@/hooks/useLogin";
import WholePageLoading from "@/components/WholePageLoading";
import { MicCheckModal } from "@/components/MicCheck";
import CentredPage from "@/components/CenteredPage";

const queryClient = new QueryClient();

function AppWithProviders() {
  const [micCheckActive, setMicCheckActive] = useState(false);
  const onCloseMicCheck = useCallback(() => {
    setMicCheckActive(false);
  }, []);

  const { auth } = useContext(UserContext);

  return (
    <QueryClientProvider client={queryClient}>
      <MicCheckContext.Provider value={{ micCheckActive, setMicCheckActive }}>
        <RouterProvider router={router} context={{ auth }} />
      </MicCheckContext.Provider>
      <MicCheckModal open={micCheckActive} onClose={onCloseMicCheck} />
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

function AppWithAuthContext() {
  const { activeUser, googleLoginProps, accessToken, onLogout, loggingIn } =
    useLogin();

  if (loggingIn) {
    return (
      <CentredPage>
        <WholePageLoading />;
      </CentredPage>
    );
  }

  return (
    <UserContext.Provider
      value={{
        auth: { user: activeUser, accessToken },
        logout: onLogout,
        googleLoginProps: googleLoginProps,
      }}
    >
      <AppWithProviders />
    </UserContext.Provider>
  );
}

let TrackedApp = AppWithProviders;
const posthog = getPosthogClient();
if (posthog) {
  TrackedApp = () => (
    <PostHogProvider client={posthog}>
      <AppWithAuthContext />
    </PostHogProvider>
  );
}

const WrappedErrorBoundedApp = withTrackedErrorBoundary(TrackedApp);

export default WrappedErrorBoundedApp;
