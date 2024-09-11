import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

export default function (name: string) {
  const posthog = usePostHog();
  useEffect(() => {
    posthog.capture("$pageview", { name });
  }, []);
}
