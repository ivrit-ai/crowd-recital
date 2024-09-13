import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { getErrorMessage } from "@/utils";
import { useDocuments } from "@/hooks/documents";
import Collapse from "@/components/Collapse";
import WikiArticleUpload from "./wikiUploadTab";
import SelectExistingDocument from "./existingDocTab";
import type { TabContentProps } from "./types";

const DocumentInput = () => {
  const navigate = useNavigate({ from: "/documents" });
  const [noDocsFound, setNoDocsFound] = useState<boolean | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const { createWikiArticleDocument } = useDocuments();

  const uploadWikiDocument = useCallback(async (wikiArticleUrl: string) => {
    setProcessing(true);
    try {
      const decodedUrl = decodeURIComponent(wikiArticleUrl);
      const { id } = await createWikiArticleDocument(decodedUrl);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      navigate({ to: "/recite/$docId", params: { docId: id } });
      setError("");

      return id;
    } catch (error) {
      setError(`ארעה שגיאה - ${getErrorMessage(error)}`);
      console.error(error);
    } finally {
      setProcessing(false);
    }
  }, []);

  const tabContentProps: TabContentProps = {
    error,
    setError,
    processing,
    setProcessing,
  };

  return (
    <div className="container mx-auto max-w-4xl self-stretch px-4 py-12">
      <h1 className="pb-6 text-2xl">בחירת טקסט להקראה</h1>

      {noDocsFound === null && (
        <div className="my-11 text-center">
          <span className="loading loading-infinity w-24"></span>
        </div>
      )}

      <Collapse title="מסמך קיים" defaultOpen={true}>
        <SelectExistingDocument
          {...tabContentProps}
          setNoDocsFound={setNoDocsFound}
        />
      </Collapse>

      {noDocsFound !== null && (
        <Collapse title="טען מאמר ויקיפדיה" defaultOpen={noDocsFound}>
          <WikiArticleUpload
            {...tabContentProps}
            loadNewDocumentFromWikiArticle={uploadWikiDocument}
          />
        </Collapse>
      )}

      <Collapse title="העלה מסמך (בקרוב)" disabled></Collapse>
      <Collapse title="הדבק טקסט חופשי (בקרוב)" disabled></Collapse>
    </div>
  );
};

export default DocumentInput;
