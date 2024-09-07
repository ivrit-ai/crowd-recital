import { RecitalSessionStatus } from "@/types/session";
import { twJoin } from "tailwind-merge";

type StatusDisplay = {
  label: string;
  progress: boolean;
  className: string;
};

function getSessionStatusDisplay(status: RecitalSessionStatus): StatusDisplay {
  switch (status) {
    case RecitalSessionStatus.Active:
    case RecitalSessionStatus.Ended:
    case RecitalSessionStatus.Aggregated:
      return {
        label: "בעבודה",
        progress: true,
        className: "badge-warning",
      };
    case RecitalSessionStatus.Uploaded:
      return {
        label: "זמין",
        progress: false,
        className: "badge-success",
      };
    case RecitalSessionStatus.Discarded:
      return {
        label: "ריק",
        progress: false,
        className: "badge-neutral",
      };
    default:
      return {
        label: "לא ידוע",
        progress: false,
        className: "badge-error",
      };
  }
}

function StatusDisplay({ status }: { status: RecitalSessionStatus }) {
  const { label, progress, className } = getSessionStatusDisplay(
    status as RecitalSessionStatus,
  );
  return (
    <div className={twJoin("badge badge-sm sm:badge-lg", className)}>
      {label}
      {progress && <div className="loading loading-infinity loading-xs mx-1" />}
    </div>
  );
}

export default StatusDisplay;
