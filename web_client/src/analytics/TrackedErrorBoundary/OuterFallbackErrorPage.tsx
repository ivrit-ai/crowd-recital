import { FallbackProps } from "react-error-boundary";
import { FallbackErrorPage } from ".";

export default function OuterFallbackErrorPage({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  return <FallbackErrorPage error={error} reset={resetErrorBoundary} />;
}
