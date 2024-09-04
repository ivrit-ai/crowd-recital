import { useCallback, useEffect, useState } from "react";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { usePostHog } from "posthog-js/react";
import type { PostHog } from "posthog-js/react";

import type { UserType } from "../../types/user";
import { User } from "../../types/user";
import { useLocalStorage } from "@uidotdev/usehooks";

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

type LoginResponse = {
  accessToken: string;
};

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
      console.log(await response.text());
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
    console.error(response);
    console.error("Login Failed.");
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

const reportLogin = (posthog: PostHog, loginResponse: LoginResponse) => {
  try {
    jwtDecode<JwtPayload & { email: string; name: string }>(
      loginResponse.accessToken,
    );
    posthog?.capture("logged_in");
  } catch (e) {
    // This is a non critical error supposedly.
    posthog?.capture("decode_access_token_failed");
    console.error(e);
  }
};

export type GoogleLoginProps = {
  onCredential: (loginCredential: string) => void;
};

export default function useLogin() {
  const posthog = usePostHog();
  const [csrfToken, setCsrfToken] = useState("");
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [loggingIn, setLoggingIn] = useState(true);
  const [accessToken, setAccessToken] = useLocalStorage<string>("actk", "");

  useEffect(() => {
    const init = async () => {
      const fetchMeResponse = await fetchMe();
      // If login is required
      if (!fetchMeResponse.success) {
        const { g_csrf_token } = fetchMeResponse as FailedFetchMeResponse;
        setCsrfToken(g_csrf_token);
      } else {
        // If user is already logged in
        const { user } = fetchMeResponse as SuccessFetchMeResponse;
        setActiveUser(new User(user));
        posthog?.identify(user.id, {
          email: user.email,
          name: user.name,
          group: user.group,
        });
      }
    };
    setLoggingIn(true);
    init().finally(() => setLoggingIn(false));
  }, [accessToken]);

  const onLogout = useCallback(
    (reload: boolean = false) => {
      posthog?.capture("logout");
      posthog?.reset();
      logout().then(() => {
        setActiveUser(null);
        setAccessToken("");
        if (reload) window.location.reload();
      });
    },
    [setActiveUser, setAccessToken],
  );

  const onGoogleLoginCredential = useCallback(
    (loginCredential: string) => {
      if (!csrfToken) {
        console.warn(
          "CSRF token not acquired in this session. Logging out to try again.",
        );
        onLogout(true);
      } else {
        const doLogin = async () => {
          posthog?.capture("authenticate_using_google_id");
          const loginResponse = await loginUsingGoogleCredential(
            loginCredential,
            csrfToken,
          );

          if (loginResponse) {
            reportLogin(posthog, loginResponse);
            setAccessToken(loginResponse.accessToken);
          }
        };

        doLogin();
      }
    },
    [setAccessToken, onLogout, csrfToken],
  );

  const googleLoginProps = {
    onCredential: onGoogleLoginCredential,
  };

  return { googleLoginProps, onLogout, activeUser, loggingIn, accessToken };
}
