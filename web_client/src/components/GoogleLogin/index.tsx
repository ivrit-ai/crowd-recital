import { useEffect, useLayoutEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";

import { EnvConfig } from "@/env/config";
import googleAccounts from "@/services/googleAccounts";

type credentialsResponseCallback = (
  response: google.accounts.id.CredentialResponse,
) => void;

const initializeGoogleAccountsIdentity = async (
  googleClientId: string,
  callback: credentialsResponseCallback,
) => {
  google.accounts.id.initialize({
    client_id: googleClientId,
    callback,
    use_fedcm_for_prompt: true,
  });
  google.accounts.id.prompt();
};

type OnCredentialCallback = (credential: string) => void;

type LoginProps = {
  onCredential: OnCredentialCallback;
};

const Login = ({ onCredential }: LoginProps) => {
  const posthog = usePostHog();
  const loginButtonParentRef = useRef(null);
  const onCredentialCallback = useRef(onCredential);
  const isLoginButtonInitialized = useRef(false);

  useLayoutEffect(() => {
    onCredentialCallback.current = onCredential;
  });

  const onLoginClicked = () => {
    posthog?.capture("login_button_clicked");
  };

  useEffect(() => {
    if (!isLoginButtonInitialized.current) {
      initializeGoogleAccountsIdentity(
        EnvConfig.get("auth_google_client_id"),
        (response) => {
          onCredentialCallback.current(response.credential);
        },
      );
      isLoginButtonInitialized.current = true;
      googleAccounts.id.renderButton(loginButtonParentRef.current!, {
        type: "standard",
        click_listener: onLoginClicked,
      });
    }
  }, []);

  return (
    <div>
      <div ref={loginButtonParentRef}></div>
    </div>
  );
};

export default Login;
