import { useCallback } from "react";

import { useKeyPress } from "@/utils";
import { NavigationArgs, NavigationControls } from "./useDocumentNavigation";

const useKeyboardControl = (
  onControl: (
    control: NavigationControls,
    navigationArgs?: NavigationArgs,
  ) => Promise<void>,
  enabled: boolean,
) => {
  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          await onControl(NavigationControls.PrevSentence);
          e.preventDefault();
          break;
        case "ArrowLeft":
          await onControl(NavigationControls.NextSentence);
          e.preventDefault();
          break;
        case "ArrowUp":
          await onControl(NavigationControls.PrevParagraph);
          e.preventDefault();
          break;
        case "ArrowDown":
          await onControl(NavigationControls.NextParagraph);
          e.preventDefault();
          break;
        case "Enter":
          await onControl(NavigationControls.Record);
          e.preventDefault();
          break;
        default:
          break;
      }
    },
    [onControl],
  );

  useKeyPress(
    enabled ? ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter"] : [],
    handleKeyDown,
  );
};

export default useKeyboardControl;
