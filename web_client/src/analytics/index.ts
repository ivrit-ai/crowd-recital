import posthog from "posthog-js";

import { EnvConfig } from "@/config";

const posthogConfigured = !!EnvConfig.get("analytics_posthog_api_key");
if (posthogConfigured) {
  posthog.init(EnvConfig.get("analytics_posthog_api_key"), {
    api_host: EnvConfig.get("analytics_posthog_host"),
    person_profiles: "identified_only",
  });
}

export default function getPosthogClient() {
  return posthogConfigured ? posthog : null;
}
