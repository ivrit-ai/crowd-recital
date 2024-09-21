import useTrackPageView from "@/analytics/useTrackPageView";
import { Document } from "@/models";
import RecitalBox from "@/components/RecitalBox";

type Props = {
  document: Document;
};

const Recite = ({ document }: Props) => {
  useTrackPageView("recite");
  throw new Error("sdf")
  return <RecitalBox document={document} />;
};

export default Recite;
