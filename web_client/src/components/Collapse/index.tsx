import { useState } from "react";
import { twJoin } from "tailwind-merge";

type CollapseProps = {
  children?: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  forceClose?: boolean;
  disabled?: boolean;
};

const Collapse = ({
  children,
  title,
  defaultOpen = false,
  forceClose = false,
  disabled = false,
}: CollapseProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      aria-disabled={disabled}
      className="collapse collapse-arrow my-4 border border-base-300"
    >
      <input
        disabled={disabled}
        type="checkbox"
        checked={forceClose || disabled ? false : open}
        onChange={() => setOpen(!open)}
        className="peer"
      />
      <div
        className={twJoin(
          "collapse-title text-lg font-medium peer-disabled:cursor-default peer-disabled:opacity-35 sm:text-xl",
        )}
      >
        {title}
      </div>
      <div className="collapse-content">{children}</div>
    </div>
  );
};

export default Collapse;
