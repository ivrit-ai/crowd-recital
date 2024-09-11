import useTrackPageView from "@/analytics/useTrackPageView";
import { Document } from "@/models";
import RecitalBox from "@/components/RecitalBox";

type Props = {
  document: Document;
};

const Recite = ({ document }: Props) => {
  useTrackPageView("recite");
  return <RecitalBox document={document} />;
};

export default Recite;
