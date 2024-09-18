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

export function secondsToMinuteSecondMillisecondString(
  seconds: number,
  showMilis: boolean = true,
): string {
  // Rounded seconds to ms
  const roundedSeconds = Math.round(seconds * 1000) / 1000;
  // Extract whole minutes, remaining whole seconds, and milliseconds
  const minutes = Math.floor(roundedSeconds / 60);
  const completeSeconds = Math.floor(roundedSeconds);
  const remainingSeconds = completeSeconds % 60;
  const milliseconds = Math.round((roundedSeconds - completeSeconds) * 1000);

  // Pad the minutes, seconds, and milliseconds with zeros to ensure correct length
  const paddedMinutes = minutes.toString().padStart(2, "0");
  const paddedSeconds = remainingSeconds.toString().padStart(2, "0");
  const paddedMilliseconds = milliseconds.toString().padStart(3, "0");

  // Concatenate minutes, seconds, and milliseconds as a mm:ss.zzz format
  const milisPart = showMilis ? `.${paddedMilliseconds}` : "";
  return `${paddedMinutes}:${paddedSeconds}${milisPart}`;
}

export { getErrorMessage } from "./tsErrorMessage";
