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

export { getErrorMessage } from "./tsErrorMessage";
