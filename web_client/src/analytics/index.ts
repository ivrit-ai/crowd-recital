import posthog from "posthog-js";

import { EnvConfig } from "@/config";

const posthogConfigured = !!EnvConfig.get("analytics_posthog_api_key");
if (posthogConfigured) {
  posthog.init(EnvConfig.get("analytics_posthog_api_key"), {
    api_host: EnvConfig.get("analytics_posthog_host"),
    person_profiles: "identified_only",
  });
}

export function getPosthogClient() {
  return posthogConfigured ? posthog : null;
}

export async function reportResponseError(
  response: Response,
  module: string,
  endpoint: string,
  defaultErrorMessage: string,
): Promise<string> {
  let errorMessage;
  try {
    const errorDetails = await response.json();
    errorMessage = errorDetails.detail;
    // If the details are an array - take from the first entry
    if (Array.isArray(errorMessage)) {
      // This is assumed to be part of the API validation - use msg field
      errorMessage = errorMessage[0]?.msg;
    }
  } catch (error) {
    console.error("Failed to parse error details:", error);
  }

  const finalErrorMessage =
    errorMessage || response.statusText || defaultErrorMessage;

  getPosthogClient()?.capture("web_client_api_error", {
    module,
    endpoint,
    $exception_message: finalErrorMessage,
    $exception_handled: true,
    exception_status_code: response.status,
  });

  return finalErrorMessage;
}
export function captureError(
  defaultErrorMessage: string,
  module: string,
  endpoint: string,
  error: Error | null,
) {
  getPosthogClient()?.capture("Client Error", {
    module,
    endpoint,
    $exception_message: error?.message || defaultErrorMessage,
    $exception_handled: true,
  });
}
