import { reportResponseError } from "@/analytics";

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
