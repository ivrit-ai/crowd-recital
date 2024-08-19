import { useEffect, useRef } from "react";

import googleAccounts from "../../services/googleAccounts";

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
  googleClientId: string;
  onCredential: OnCredentialCallback;
};

const Login = ({ googleClientId, onCredential }: LoginProps) => {
  const loginButtonParentRef = useRef(null);

  useEffect(() => {
    if (googleClientId) {
      initializeGoogleAccountsIdentity(googleClientId, (response) => {
        onCredential(response.credential);
      });
      googleAccounts.id.renderButton(loginButtonParentRef.current!, {
        type: "standard",
      });
    }
  }, [googleClientId, onCredential]);

  return (
    <div>
      <div ref={loginButtonParentRef}></div>
    </div>
  );
};

export default Login;
