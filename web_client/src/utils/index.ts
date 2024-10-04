import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/**
 Use tailwind intellisense
 
 see: `.vscode\settings.json`
 regex defined by `tailwindCSS.experimental.classRegex`
 should match the literal string argument passed to this function.

 @returns the argument as is.
  */
export const tw = <T extends string>(classes: T) => classes;

export const useKeyPress = (
  keys: string[],
  callback: (event: KeyboardEvent) => void,
  node: HTMLElement | null | undefined = null,
) => {
  // implement the callback ref pattern
  const callbackRef = useRef(callback);
  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  // handle what happens on key press
  const handleKeyPress = useCallback(
    (event: Event) => {
      const keyboardEvent = <KeyboardEvent>event;
      // check if one of the key is part of the ones we want
      if (keys.some((key) => keyboardEvent.key === key)) {
        callbackRef.current(keyboardEvent);
      }
    },
    [keys],
  );

  useEffect(() => {
    // target is either the provided node or the document
    const targetNode = node ?? document;
    // attach the event listener
    targetNode && targetNode.addEventListener("keydown", handleKeyPress);

    // remove the event listener
    return () =>
      targetNode && targetNode.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress, node]);
};

export function secondsToHourMinuteSecondString(
  seconds: number,
  showMilis: boolean = true,
): string {
  // Check if the time is more than or equal to 1 hour
  const hasHours = seconds >= 3600;

  // Ignore milliseconds if we have hours
  if (hasHours) {
    showMilis = false;
  }

  // Rounded seconds to milliseconds or whole seconds based on showMilis
  const roundedSeconds = showMilis
    ? Math.round(seconds * 1000) / 1000
    : Math.floor(seconds);

  // Total whole seconds
  const totalSeconds = Math.floor(roundedSeconds);

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  // Calculate milliseconds if needed
  const milliseconds = showMilis
    ? Math.round((roundedSeconds - totalSeconds) * 1000)
    : 0;

  // Pad hours, minutes, seconds, and milliseconds with zeros
  const paddedHours = hours.toString().padStart(2, "0");
  const paddedMinutes = minutes.toString().padStart(2, "0");
  const paddedSeconds = remainingSeconds.toString().padStart(2, "0");
  const paddedMilliseconds = milliseconds.toString().padStart(3, "0");

  // Build the time string based on whether hours are present
  if (hasHours) {
    // Format: HH:MM:SS
    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  } else {
    // Format: MM:SS or MM:SS.mmm
    const milisPart = showMilis ? `.${paddedMilliseconds}` : "";
    return `${paddedMinutes}:${paddedSeconds}${milisPart}`;
  }
}

export const logDevOnly = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

export { getErrorMessage } from "./tsErrorMessage";
