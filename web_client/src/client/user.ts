import { reportResponseError } from "@/analytics";
import { UserType, User, UserProfile } from "@/types/user";

export const userApiBaseUrl = "/api/me";

export async function signUserAgreement(): Promise<void> {
  const response = await fetch(`${userApiBaseUrl}/agree`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = await reportResponseError(
      response,
      "user",
      "signAgreement",
      "Failed to submit agreement signature",
    );
    throw new Error(errorMessage);
  }
}

export type FailedFetchUserResponse = {
  googleClientId: string;
  g_csrf_token: string;
};

export type SuccessFetchUserResponse = {
  user: UserType;
};

type FetchUserResponse = {
  success: boolean;
} & (FailedFetchUserResponse | SuccessFetchUserResponse);

export const getUserIfLoggedIn = async () => {
  let fetchUserResponse: FetchUserResponse;
  const response = await fetch(`${userApiBaseUrl}`, {
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
      fetchUserResponse = {
        success: false,
        googleClientId,
        g_csrf_token: gCsrfToken,
      };
    } else {
      console.log(await response.text());
      throw new Error(
        `Fetch User Failed - ${response.status} - ${response.statusText}`,
      );
    }
  } else {
    const fetchUserDto = await response.json();
    fetchUserResponse = {
      success: true,
      user: User.fromDTO(fetchUserDto),
    };
  }

  return fetchUserResponse;
};

export const getUserProfile = async () => {
  const response = await fetch(`${userApiBaseUrl}/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (!response.ok) {
    const errorMessage = await reportResponseError(
      response,
      "user",
      "getUserProfile",
      "Failed to get user profile",
    );
    throw new Error(errorMessage);
  } else {
    const fetchUserProfileDto = await response.json();
    return UserProfile.fromDTO(fetchUserProfileDto);
  }
};

export async function updateUserProfile(update: UserProfile): Promise<void> {
  const updateDto = UserProfile.toDTO(update);
  // By default - we send nothing but what was explicitly set
  const updatedFields: { [key: string]: unknown } = {};
  for (const [key, value] of Object.entries(updateDto)) {
    if (value !== undefined) {
      updatedFields[key] = value;
    }
  }

  const response = await fetch(`${userApiBaseUrl}/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedFields),
  });

  if (!response.ok) {
    const errorMessage = await reportResponseError(
      response,
      "user",
      "updateUserProfile",
      "Failed to update user profile",
    );
    throw new Error(errorMessage);
  }
}

export type LoginResponse = {
  accessToken: string;
};

export const loginUsingGoogleCredential = async (
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

export const logout = async () => {
  const response = await fetch("/api/logout", {
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
