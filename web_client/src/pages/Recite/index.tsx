import { useContext, useState } from "react";

import { UserContext } from "@/context/user";
import { Document } from "@/models";
import DocumentInput from "@/components/DocumentInput";
import RecitalBox from "@/components/RecitalBox";
import NotASpeaker from "./NotASpeaker";

const Recite = () => {
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const { user: activeUser } = useContext(UserContext);

  if (!activeUser) {
    return null; // This is not expected
  }

  const clearActiveDocument = () => setActiveDocument(null);

  if (!activeUser.isSpaker()) {
    return <NotASpeaker userEmail={activeUser.email} />;
  }

  return activeDocument ? (
    <RecitalBox
      document={activeDocument}
      clearActiveDocument={clearActiveDocument}
    />
  ) : (
    <DocumentInput setActiveDocument={setActiveDocument} />
  );
};

export default Recite;
