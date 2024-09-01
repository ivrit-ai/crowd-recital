import { UserContext } from "@/context/user";
import { RouteContext, Routes } from "./context/route";
import useLogin from "@/hooks/useLogin";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Recite from "@/pages/Recite";
import Admin from "@/pages/Admin";
import { useState } from "react";

const WholePageLoading = () => {
  return (
    <div className="hero">
      <span className="loading loading-infinity w-40"></span>
    </div>
  );
};

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
  const [route, setRoute] = useState<Routes>(Routes.Recital);
  const { activeUser, googleLoginProps, onLogout, loggingIn } = useLogin();

  return (
    <UserContext.Provider value={{ user: activeUser, logout: onLogout }}>
      <RouteContext.Provider
        value={{ activeRoute: route, setActiveRoute: setRoute }}
      >
        <Layout header={!!activeUser} footer={!activeUser}>
          {loggingIn ? (
            <WholePageLoading />
          ) : activeUser ? (
            renderRoute(route)
          ) : (
            <Login googleLoginProps={googleLoginProps} />
          )}
        </Layout>
      </RouteContext.Provider>
    </UserContext.Provider>
  );
}

export default App;
