import GoogleLogin from "@/components/GoogleLogin";
import type { GoogleLoginProps } from "@/hooks/useLogin";

interface Props {
  googleLoginProps: GoogleLoginProps;
}

const Login = ({ googleLoginProps }: Props) => {
  return (
    <div
      className="hero min-h-screen"
      style={{
        backgroundImage:
          "radial-gradient(circle at center, white 0, black 70%, white 100%)",
      }}
    >
      <div className="card bg-base-100 m-5 shadow-xl lg:w-96">
        <div className="hero-content card-body flex-col">
          <div className="text-center align-middle">
            <h1 className="text-4xl font-bold">עברית.ai</h1>
            <p className="pt-6 text-xl">מה נשמע? טוב שבאת!</p>
            <p className="py-2">רק תתחבר זריז שנדע מי אתה וזה...</p>
          </div>
          <div className="card-actions">
            <GoogleLogin {...googleLoginProps} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
