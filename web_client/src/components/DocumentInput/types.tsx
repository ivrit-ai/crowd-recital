export enum EntryMethods {
  WIKI = 1,
  EXISTING = 2,
}

export interface TabContentProps {
  error: string | null;
  setError: (error: string) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  setEntryMode: (mode: EntryMethods) => void;
}
