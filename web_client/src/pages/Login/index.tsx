import { useContext } from "react";
import GoogleLogin from "@/components/GoogleLogin";

import ivritAiLogo from "../../assets/ivrit_ai_logo.webp";
import { UserContext } from "@/context/user";

const Login = () => {
  const { googleLoginProps } = useContext(UserContext);

  return (
    <div
      className="hero min-h-screen"
      style={{
        backgroundImage:
          "radial-gradient(circle at center, white 0, grey 70%, white 100%)",
      }}
    >
      <div className="sm:w-2xl card m-5 bg-base-100 shadow-xl">
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
