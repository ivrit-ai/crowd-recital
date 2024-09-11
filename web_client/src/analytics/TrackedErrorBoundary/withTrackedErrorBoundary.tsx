import { ComponentType, ErrorInfo } from "react";
import { withErrorBoundary } from "react-error-boundary";

import { getPosthogClient } from "@/analytics";
import OuterFallbackErrorPage from "./OuterFallbackErrorPage";

export const reportCaughtError = (error: Error | null, info: ErrorInfo) => {
  const posthog = getPosthogClient();
  posthog?.capture("web_client_react_error", {
    $exception_message: error?.message,
    $exception_stack_trace_raw: error?.stack,
    error_component_stack: info.componentStack,
  });
};

export const withTrackedErrorBoundary = (app: ComponentType) => {
  return withErrorBoundary(app, {
    fallbackRender: ({ error, resetErrorBoundary }) => (
      <OuterFallbackErrorPage
        error={error}
        resetErrorBoundary={resetErrorBoundary}
      />
    ),
    onError: reportCaughtError,
  });
};
