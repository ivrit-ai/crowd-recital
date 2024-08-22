import { useState } from "react";

import type { User } from "@/types/user";
import { UserGroups } from "@/types/user";
import { Document } from "@/models";
import DocumentInput from "@/components/DocumentInput";
import RecitalBox from "@/components/RecitalBox";
import NotASpeaker from "./NotASpeaker";

interface Props {
  activeUser: User;
}

const Recite = ({ activeUser }: Props) => {
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);

  const clearActiveDocument = () => setActiveDocument(null);

  if (
    !activeUser.group ||
    ![(UserGroups.Admin, UserGroups.Speaker)].includes(activeUser.group)
  ) {
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
