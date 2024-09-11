import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import type { TextDocumentResponse } from "@/models";
import { getErrorMessage } from "@/utils";
import { useDocuments } from "@/hooks/documents";
import Collapse from "@/components/Collapse";
import WikiArticleUpload from "./wikiUploadTab";
import SelectExistingDocument from "./existingDocTab";
import type { TabContentProps } from "./types";

type uploaderThunk<T extends unknown[] = unknown[]> = (
  ...args: T
) => Promise<string>;

const DocumentInput = () => {
  const navigate = useNavigate({ from: "/docs" });
  const [existingDocuments, setExistingDocuments] = useState<
    TextDocumentResponse[] | null
  >(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const { createWikiArticleDocument, loadUserDocuments } = useDocuments();

  useEffect(() => {
    setProcessing(true);
    loadUserDocuments().then((documents) => {
      setExistingDocuments(documents);
      setProcessing(false);
    });
  }, [setProcessing, loadUserDocuments, setExistingDocuments]);

  const uploadWrapper = <T extends unknown[]>(uploader: uploaderThunk<T>) => {
    return async (...args: T) => {
      setProcessing(true);
      try {
        const docId = await uploader(...args);
        navigate({ to: "/recite/$docId", params: { docId } });
        setError("");
      } catch (error) {
        setError(`ארעה שגיאה - ${getErrorMessage(error)}`);
        console.error(error);
      } finally {
        setProcessing(false);
      }
    };
  };

  const loadNewDocumentFromWikiArticle = uploadWrapper(
    async (wikiArticleUrl: string) => {
      const decodedUrl = decodeURIComponent(wikiArticleUrl);
      const { id } = await createWikiArticleDocument(decodedUrl);
      return id;
    },
  );

  const loadExistingDocumentById = uploadWrapper(
    async (selectedDocumentId: string) => {
      return selectedDocumentId;
    },
  );

  const tabContentProps: TabContentProps = {
    error,
    setError,
    processing,
    setProcessing,
  };

  return (
    <div className="container mx-auto max-w-4xl self-stretch px-4 py-12">
      <h1 className="pb-6 text-2xl">בחירת טקסט להקראה</h1>

      {existingDocuments && (
        <Collapse title="מסמך קיים" defaultOpen={existingDocuments.length > 0}>
          <SelectExistingDocument
            {...tabContentProps}
            existingDocuments={existingDocuments}
            loadExistingDocumentById={loadExistingDocumentById}
          />
        </Collapse>
      )}

      {existingDocuments && (
        <Collapse
          title="טען מאמר ויקיפדיה"
          defaultOpen={existingDocuments.length == 0}
        >
          <WikiArticleUpload
            {...tabContentProps}
            loadNewDocumentFromWikiArticle={loadNewDocumentFromWikiArticle}
          />
        </Collapse>
      )}

      <Collapse title="העלה מסמך (בקרוב)" disabled></Collapse>
      <Collapse title="הדבק טקסט חופשי (בקרוב)" disabled></Collapse>
    </div>
  );
};

export default DocumentInput;
