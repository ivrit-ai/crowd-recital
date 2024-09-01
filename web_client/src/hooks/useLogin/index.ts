import { useCallback, useEffect, useState } from "react";
import type { UserType } from "../../types/user";
import { User } from "../../types/user";

type FailedFetchMeResponse = {
  googleClientId: string;
  g_csrf_token: string;
};

type SuccessFetchMeResponse = {
  user: UserType;
};

type FetchMeResponse = {
  success: boolean;
} & (FailedFetchMeResponse | SuccessFetchMeResponse);

const fetchMe = async () => {
  let fetchMeResponse: FetchMeResponse;
  const response = await fetch(`api/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (!response.ok) {
    if (response.status === 401) {
      const authFailureBody = await response.json();
      const googleClientId = authFailureBody.detail.google_client_id;
      const gCsrfToken = authFailureBody.detail.g_csrf_token;
      fetchMeResponse = {
        success: false,
        googleClientId,
        g_csrf_token: gCsrfToken,
      };
    } else {
      throw new Error(
        `Fetch Me Failed - ${response.status} - ${response.statusText}`,
      );
    }
  } else {
    const fetchMeBody = await response.json();
    fetchMeResponse = {
      success: true,
      user: fetchMeBody,
    };
  }

  return fetchMeResponse;
};

type LoginResponse = {
  accessToken: string;
};

const loginUsingGoogleCredential = async (
  googleCredential: string,
  gCsrfToken: string,
) => {
  const formData = new FormData();
  formData.append("credential", googleCredential);
  formData.append("g_csrf_token", gCsrfToken);
  const response = await fetch("api/login", {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  });
  if (!response.ok) {
    console.log(response);
    console.log("Login Failed.");
    return null;
  } else {
    const loginResponseBody = await response.json();
    const loginResponse: LoginResponse = {
      accessToken: loginResponseBody.access_token,
    };
    return loginResponse;
  }
};

const logout = async () => {
  const response = await fetch("api/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(
      `Logout Failed - ${response.status} - ${response.statusText}`,
    );
  }
};

export type GoogleLoginProps = {
  onCredential: (loginCredential: string) => void;
  googleClientId: string;
};

export default function useLogin() {
  const [googleClientId, setGoogleClientId] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      const fetchMeResponse = await fetchMe();
      // If login is required
      if (!fetchMeResponse.success) {
        const { googleClientId, g_csrf_token } =
          fetchMeResponse as FailedFetchMeResponse;
        setGoogleClientId(googleClientId);
        setCsrfToken(g_csrf_token);
      } else {
        // If user is already logged in
        const { user } = fetchMeResponse as SuccessFetchMeResponse;
        setActiveUser(new User(user));
      }
    };
    setLoggingIn(true);
    init().finally(() => setLoggingIn(false));
  }, [setGoogleClientId, setActiveUser, setLoggingIn, accessToken]);

  const onGoogleLoginCredential = useCallback(
    (loginCredential: string) => {
      const doLogin = async () => {
        const loginResponse = await loginUsingGoogleCredential(
          loginCredential,
          csrfToken,
        );

        if (loginResponse) {
          setAccessToken(loginResponse.accessToken);
        }
      };

      doLogin();
    },
    [setAccessToken, csrfToken],
  );

  const onLogout = useCallback(() => {
    logout().then(() => {
      setActiveUser(null);
      setAccessToken("");
    });
  }, [setActiveUser, setAccessToken]);

  const googleLoginProps = {
    googleClientId,
    onCredential: onGoogleLoginCredential,
  };

  return { googleLoginProps, onLogout, activeUser, loggingIn, accessToken };
}
