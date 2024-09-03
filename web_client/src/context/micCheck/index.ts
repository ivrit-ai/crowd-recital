import { createContext } from "react";

type MicCheckContextType = {
  micCheckActive: boolean;
  setMicCheckActive: (active: boolean) => void;
};

const MicCheckContext = createContext<MicCheckContextType>({
  micCheckActive: false,
  setMicCheckActive: () => {},
});

export { MicCheckContext, type MicCheckContextType };
