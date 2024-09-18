import { useCallback } from "react";
import {
  NavigationMoves,
  NavigationControls,
  NavigationArgs,
} from "./useDocumentNavigation";

const useControlCallback = (
  move: NavigationMoves,
  recording: boolean,
  createNewSession: () => Promise<string>,
  finalizeSession: () => Promise<void>,
  setSessionId: (sessionId: string) => void,
  startRecording: (sessionId: string) => void,
  uploadActiveSentence: () => void,
  setSessionStartError: (error: Error | null) => void,
  clearTextUploaderError: () => void,
) => {
  const onControl = useCallback(
    async (control: NavigationControls, navigationArgs?: NavigationArgs) => {
      let shouldStopRecording = false;
      switch (control) {
        case NavigationControls.NextSentence:
          if (recording) {
            uploadActiveSentence();
          }
          if (!move.nextSentence()) {
            shouldStopRecording = !!recording;
          }
          break;
        case NavigationControls.PrevSentence:
          if (!recording) {
            move.prevSentence();
          }
          break;
        case NavigationControls.NextParagraph:
          if (!recording) {
            move.nextParagraph();
          }
          break;
        case NavigationControls.PrevParagraph:
          if (!recording) {
            move.prevParagraph();
          }
          break;
        case NavigationControls.GoToParagraph:
          if (!recording && navigationArgs) {
            move.toParagraphSentence(
              navigationArgs.paragraph,
              navigationArgs.sentence,
            );
          }
          break;
        case NavigationControls.Record:
          if (recording) {
            shouldStopRecording = true;
          } else {
            clearTextUploaderError();
            setSessionStartError(null);
            createNewSession()
              .then((sessionId) => {
                setSessionId(sessionId);
                startRecording(sessionId);
              })
              .catch((err) => setSessionStartError(err));
          }
          break;

        default:
          break;
      }

      if (shouldStopRecording) {
        finalizeSession();
      }
    },
    [
      move,
      recording,
      createNewSession,
      finalizeSession,
      setSessionId,
      startRecording,
      uploadActiveSentence,
    ],
  );

  return onControl;
};

export default useControlCallback;
