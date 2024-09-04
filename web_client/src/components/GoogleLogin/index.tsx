import { useEffect, useLayoutEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";

import { EnvConfig } from "@/config";
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
  });
  google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // console.log(notification);
      // TODO - consider handling dismissale of the prompt
    }
  });
};

type OnCredentialCallback = (credential: string) => void;

type LoginProps = {
  onCredential: OnCredentialCallback;
};

const Login = ({ onCredential }: LoginProps) => {
  const posthog = usePostHog();
  const loginButtonParentRef = useRef(null);
  const onCredentialCallback = useRef(onCredential);

  useLayoutEffect(() => {
    onCredentialCallback.current = onCredential;
  });

  const onLoginClicked = () => {
    posthog?.capture("login_button_clicked");
  };

  useEffect(() => {
    initializeGoogleAccountsIdentity(
      EnvConfig.get("auth_google_client_id"),
      (response) => {
        onCredentialCallback.current(response.credential);
      },
    );
    googleAccounts.id.renderButton(loginButtonParentRef.current!, {
      type: "standard",
      click_listener: onLoginClicked,
    });
  }, []);

  return (
    <div>
      <div ref={loginButtonParentRef}></div>
    </div>
  );
};

export default Login;
