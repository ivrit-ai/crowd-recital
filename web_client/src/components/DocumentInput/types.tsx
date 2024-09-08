export interface TabContentProps {
  error: string | null;
  setError: (error: string) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
}
