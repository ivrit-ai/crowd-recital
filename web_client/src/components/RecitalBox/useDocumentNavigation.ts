import { useLocalStorage } from "@uidotdev/usehooks";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Document } from "@/models";

export type NavigationMoves = {
  nextParagraph: () => void;
  prevParagraph: () => void;
  nextSentence: () => boolean;
  prevSentence: () => void;
  toParagraphSentence: (paragraphIndex: number, sentenceIndex: number) => void;
};

export type NavigationArgs = {
  paragraph: number;
  sentence: number;
};

export enum NavigationControls {
  NextSentence = 1,
  PrevSentence,
  NextParagraph,
  PrevParagraph,
  GoToParagraph,
  Record,
}

type LocationCheckpoint = {
  id: string;
  paragraphIdx: number;
  sentenceIdx: number;
  lastUpdate: Date;
};

const StoreLocCheckpointsKey = "doclocs";
const maxStoredLocCheckpoints = 5;

const useDocumentNavigation = (document: Document) => {
  const [activeParagraphIndex, setActiveParagraphIndex] = useState<number>(0);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(0);
  const [locationCheckpoints, setLocationCheckpoints] = useLocalStorage<
    LocationCheckpoint[]
  >(StoreLocCheckpointsKey, []);

  // Store the latest location checkpoint of the active doc
  useEffect(() => {
    // Anything meaningful to store?
    if (document.id && (activeParagraphIndex > 0 || activeSentenceIndex > 0)) {
      const locationCheckpoint = {
        id: document.id,
        paragraphIdx: activeParagraphIndex,
        sentenceIdx: activeSentenceIndex,
        lastUpdate: new Date(),
      };
      setLocationCheckpoints((checkpoints) => {
        let nextCpsState = checkpoints || [];
        const existsAtIdx = nextCpsState.findIndex(
          (cp) => cp.id === document.id,
        );
        if (existsAtIdx >= 0) {
          // Do not store if already reflects current state - this would be
          // an infinte loop
          const {
            paragraphIdx: lastParagraphIdx,
            sentenceIdx: lastSentenceIdx,
          } = nextCpsState[existsAtIdx];
          if (
            locationCheckpoint.paragraphIdx !== lastParagraphIdx ||
            locationCheckpoint.sentenceIdx !== lastSentenceIdx
          ) {
            nextCpsState = [...nextCpsState];
            nextCpsState[existsAtIdx] = locationCheckpoint;
          }
        } else {
          nextCpsState = [...nextCpsState];
          // If have room to add one more - push to end.
          if (nextCpsState.length + 1 <= maxStoredLocCheckpoints) {
            nextCpsState.push(locationCheckpoint);
          } else {
            // Find the least recently updated one and replace it
            const replaceAtIdx = nextCpsState.reduce((minIdx, cp, idx) => {
              if (cp.lastUpdate < nextCpsState[minIdx].lastUpdate) {
                return idx;
              }
              return minIdx;
            }, 0);
            nextCpsState[replaceAtIdx] = locationCheckpoint;
          }
        }
        return nextCpsState;
      });
    }
  }, [
    document,
    setLocationCheckpoints,
    activeParagraphIndex,
    activeSentenceIndex,
  ]);

  // Recall doc location if available
  useEffect(() => {
    const thisDocCp = locationCheckpoints?.find((cp) => cp.id === document.id);
    if (thisDocCp) {
      setActiveParagraphIndex(thisDocCp.paragraphIdx);
      setActiveSentenceIndex(thisDocCp.sentenceIdx);
    }
  }, [locationCheckpoints, document]);

  const goToParagraphSentence = useCallback(
    (paragraphIndex: number, sentenceIndex: number) => {
      const paragraphIndexToGoTo = Math.max(
        0,
        Math.min(paragraphIndex, document.paragraphs.length - 1),
      );
      const sentenceIndexToGoTo = Math.max(
        0,
        Math.min(
          sentenceIndex,
          document.paragraphs[paragraphIndexToGoTo].sentences.length - 1,
        ),
      );
      setActiveParagraphIndex(paragraphIndexToGoTo);
      setActiveSentenceIndex(sentenceIndexToGoTo);
    },
    [setActiveParagraphIndex, setActiveSentenceIndex, document],
  );

  const moveToNextSentence = useCallback(() => {
    const activeParagraph = document.paragraphs[activeParagraphIndex];
    const isLastParagraph =
      activeParagraphIndex === document.paragraphs.length - 1;
    const isLastSentence =
      activeSentenceIndex === activeParagraph.sentences.length - 1;
    if (isLastSentence) {
      if (isLastParagraph) {
        return false; // No where to go further
      }
      setActiveParagraphIndex((prev) => prev + 1);
      setActiveSentenceIndex(0);
    } else {
      setActiveSentenceIndex((prev) => prev + 1);
    }

    return true;
  }, [
    setActiveParagraphIndex,
    setActiveSentenceIndex,
    activeParagraphIndex,
    activeSentenceIndex,
    document,
  ]);

  const moveToPrevSentence = useCallback(() => {
    const isFirstParagraph = activeParagraphIndex === 0;
    const isFirstSentence = activeSentenceIndex === 0;
    if (isFirstSentence) {
      if (isFirstParagraph) {
        return; // No where to go further
      }
      setActiveParagraphIndex((prev) => prev - 1);
      setActiveSentenceIndex(
        document.paragraphs[activeParagraphIndex - 1].sentences.length - 1,
      );
    } else {
      setActiveSentenceIndex((prev) => prev - 1);
    }
  }, [
    setActiveParagraphIndex,
    setActiveSentenceIndex,
    activeParagraphIndex,
    activeSentenceIndex,
    document,
  ]);

  const moveToNextParagraph = useCallback(() => {
    const isLastParagraph =
      activeParagraphIndex === document.paragraphs.length - 1;
    if (isLastParagraph) {
      setActiveSentenceIndex(
        document.paragraphs[activeParagraphIndex].sentences.length - 1,
      );
      return; // No where to go further
    }
    setActiveParagraphIndex((prev) => prev + 1);
    setActiveSentenceIndex(0);
  }, [
    setActiveParagraphIndex,
    setActiveSentenceIndex,
    activeParagraphIndex,
    document,
  ]);

  const moveToPrevParagraph = useCallback(() => {
    const isFirstParagraph = activeParagraphIndex === 0;
    setActiveSentenceIndex(0);
    if (isFirstParagraph) {
      return; // No where to go further
    }
    setActiveParagraphIndex((prev) => prev - 1);
  }, [
    setActiveParagraphIndex,
    setActiveSentenceIndex,
    activeParagraphIndex,
    document,
  ]);

  const activeParagraph = document.paragraphs[activeParagraphIndex];
  const activeSentence = activeParagraph.sentences[activeSentenceIndex];
  const move = useMemo<NavigationMoves>(
    () => ({
      nextParagraph: moveToNextParagraph,
      prevParagraph: moveToPrevParagraph,
      nextSentence: moveToNextSentence,
      prevSentence: moveToPrevSentence,
      toParagraphSentence: goToParagraphSentence,
    }),
    [
      moveToNextParagraph,
      moveToPrevParagraph,
      moveToNextSentence,
      moveToPrevSentence,
      goToParagraphSentence,
    ],
  );

  return {
    activeParagraphIndex,
    activeSentenceIndex,
    activeParagraph,
    activeSentence,
    move,
  } as const;
};

export default useDocumentNavigation;
