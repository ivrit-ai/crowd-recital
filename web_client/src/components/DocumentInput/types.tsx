export enum EntryMethods {
  WIKI = "wiki",
  EXISTING = "existing",
}

export interface TabContentProps {
  error: string | null;
  setError: (error: string) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  setEntryMode: (mode: EntryMethods) => void;
}
