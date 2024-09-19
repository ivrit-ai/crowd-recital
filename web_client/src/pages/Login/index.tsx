import { useContext } from "react";
import GoogleLogin from "@/components/GoogleLogin";

import useTrackPageView from "@/analytics/useTrackPageView";
import ivritAiLogo from "../../assets/ivrit_ai_logo.webp";
import { UserContext } from "@/context/user";
import HebrewSoup from "@/components/HebrewSoup/HebrewSoup";

const Login = () => {
  useTrackPageView("login");
  const { googleLoginProps } = useContext(UserContext);

  return (
    <div className="hero min-h-screen">
      <HebrewSoup />
      <div className="sm:w-2xl card m-5 bg-base-100 opacity-90 shadow-xl">
        <div className="card-body hero-content flex sm:flex-row">
          <aside>
            <img src={ivritAiLogo} alt="Ivrit.ai logo" />
          </aside>
          <div className="flex-col">
            <div className="text-center align-middle">
              <h1 className="text-4xl font-bold">עברית.ai</h1>
              <p className="pt-6 text-xl">מה אתה אומר?!</p>
            </div>
            <div className="card-actions my-4 flex flex-row justify-center">
              <GoogleLogin {...googleLoginProps} />
            </div>
            <p className="py-2">רק תתחבר זריז שנדע מי אתה וזה...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
