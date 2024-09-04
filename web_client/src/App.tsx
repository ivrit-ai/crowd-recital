import { useCallback, useState } from "react";
import { PostHogProvider } from "posthog-js/react";

import { getPosthogClient } from "@/analytics";
import { withTrackedErrorBoundary } from "@/analytics/TrackedErrorBoundary";
import { UserContext } from "@/context/user";
import { RouteContext, Routes } from "./context/route";
import { MicCheckContext } from "./context/micCheck";
import useLogin from "@/hooks/useLogin";
import Layout from "@/components/Layout";
import WholePageLoading from "@/components/WholePageLoading";
import Login from "@/pages/Login";
import Recite from "@/pages/Recite";
import Admin from "@/pages/Admin";
import { MicCheckModal } from "@/components/MicCheck";

function renderRoute(route: Routes) {
  switch (route) {
    case Routes.Recital:
      return <Recite />;
    case Routes.Admin:
      return <Admin />;
    default:
      return <Recite />;
  }
}

function App() {
  const [micCheckActive, setMicCheckActive] = useState(false);
  const onCloseMicCheck = useCallback(() => {
    setMicCheckActive(false);
  }, []);
  const [route, setRoute] = useState<Routes>(Routes.Recital);
  const { activeUser, googleLoginProps, accessToken, onLogout, loggingIn } =
    useLogin();

  const loginRequired = !activeUser || !accessToken;

  return (
    <UserContext.Provider
      value={{ user: activeUser, accessToken, logout: onLogout }}
    >
      <RouteContext.Provider
        value={{ activeRoute: route, setActiveRoute: setRoute }}
      >
        <MicCheckContext.Provider value={{ micCheckActive, setMicCheckActive }}>
          <Layout header={!loginRequired} footer={loginRequired}>
            {loggingIn ? (
              <WholePageLoading />
            ) : loginRequired ? (
              <Login googleLoginProps={googleLoginProps} />
            ) : (
              renderRoute(route)
            )}
          </Layout>
        </MicCheckContext.Provider>
        <MicCheckModal open={micCheckActive} onClose={onCloseMicCheck} />
      </RouteContext.Provider>
    </UserContext.Provider>
  );
}

let ExportedApp = App;
const posthog = getPosthogClient();
if (posthog) {
  ExportedApp = () => (
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  );
}

const WrappedErrorBoundedApp = withTrackedErrorBoundary(ExportedApp);

export default WrappedErrorBoundedApp;
