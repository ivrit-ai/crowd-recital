import { Document } from "@/models";
import RecitalBox from "@/components/RecitalBox";

type Props = {
  activeDocument: Document;
};

const Recite = ({ activeDocument }: Props) => {
  return <RecitalBox document={activeDocument} />;
};

export default Recite;
