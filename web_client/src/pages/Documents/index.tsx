import useTrackPageView from "@/analytics/useTrackPageView";
import DocumentInput from "@/components/DocumentInput";

function Documents() {
  useTrackPageView("documents");
  return (
    <div className="container mx-auto max-w-6xl">
      <DocumentInput />
    </div>
  );
}

export default Documents;
