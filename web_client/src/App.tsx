import { UserContext } from "@/context/user";
import useLogin from "@/hooks/useLogin";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Recite from "@/pages/Recite";

const WholePageLoading = () => {
  return (
    <div className="hero">
      <span className="loading loading-infinity w-40"></span>
    </div>
  );
};

function App() {
  const { activeUser, googleLoginProps, onLogout, loggingIn } = useLogin();

  return (
    <UserContext.Provider value={{ user: activeUser, logout: onLogout }}>
      <Layout header={!!activeUser} footer={!activeUser}>
        {loggingIn ? (
          <WholePageLoading />
        ) : activeUser ? (
          <Recite activeUser={activeUser} />
        ) : (
          <Login googleLoginProps={googleLoginProps} />
        )}
      </Layout>
    </UserContext.Provider>
  );
}

export default App;
