import { useCallback, useState, useEffect } from "react";
import { twJoin } from "tailwind-merge";

import type { TextDocumentResponse } from "@crct/models";
import { getErrorMessage } from "@crct/utils";
import { Document } from "@crct/models";
import { useDocuments } from "@crct/hooks/documents";

const createDocumentUrl = "/api/create_document_from_source";
const loadDocumentsUrl = "/api/documents";

type DocumentManagerProps = {
  setActiveDocument: (document: Document | null) => void;
  activeDocument: Document | null;
};

const DocumentInput = ({
  setActiveDocument,
  activeDocument,
}: DocumentManagerProps) => {
  const [existingDocuments, setExistingDocuments] = useState<
    TextDocumentResponse[]
  >([]);
  const [existingId, setExistingId] = useState("");
  const [wikiArticleUrl, setWikiArticleUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [validUrl, setValidUrl] = useState(false);

  const { createWikiArticleDocument, loadDocumentById, loadUserDocuments } =
    useDocuments(createDocumentUrl, loadDocumentsUrl);

  useEffect(() => {
    loadUserDocuments().then((documents) => setExistingDocuments(documents));
  }, [loadUserDocuments, setExistingDocuments]);

  useEffect(() => {
    setValidUrl(!wikiArticleUrl || URL.canParse(wikiArticleUrl));
  }, [wikiArticleUrl, setValidUrl]);

  const loadNewDocumentFromWikiArticle = useCallback(async () => {
    setProcessing(true);
    try {
      if (!validUrl) {
        setError("זהו אינו קישור חוקי");
        return;
      }

      const decodedUrl = decodeURIComponent(wikiArticleUrl);
      const { id } = await createWikiArticleDocument(decodedUrl);
      const doc = await loadDocumentById(id);
      setActiveDocument(Document.fromTextDocument(doc));
      setError("");
      setWikiArticleUrl("");
    } catch (error) {
      setError(`${getErrorMessage(error)} - ארעה שגיאה בעת יצירת מסמך הטקסט`);
      console.error(error);
    } finally {
      setProcessing(false);
    }
  }, [
    createWikiArticleDocument,
    loadDocumentById,
    setActiveDocument,
    wikiArticleUrl,
    validUrl,
  ]);

  const loadExistingDocumentById = useCallback(
    async (selectedDocumentId?: string) => {
      setProcessing(true);
      try {
        const doc = await loadDocumentById(selectedDocumentId || existingId);
        setActiveDocument(Document.fromTextDocument(doc));
        setError("");
        setWikiArticleUrl("");
      } catch (error) {
        setError(`${getErrorMessage(error)} - ארעה שגיאה בעת טעינת הטקסט`);
        console.error(error);
      } finally {
        setProcessing(false);
      }
    },
    [loadDocumentById, existingId],
  );

  if (processing) {
    return <div>Processing...</div>;
  }

  return (
    <div>
      {activeDocument ? (
        <button onClick={() => setActiveDocument(null)}>טקסט אחר</button>
      ) : (
        <div>
          <div>
            <label>מאמר ויקיפדיה בעברית</label>
            <input
              type="url"
              placeholder="קישור מלא למאמר"
              className={twJoin("w-full", !validUrl && "border border-red-500")}
              value={wikiArticleUrl}
              onChange={(e) => setWikiArticleUrl(e.target.value)}
            />
            <button onClick={loadNewDocumentFromWikiArticle}>טען טקסט</button>
            <ul dir="ltr" className="font-mono">
              <li>https://he.wikipedia.org/wiki/מרגרט_המילטון_(מדענית)</li>
              <li>https://he.wikipedia.org/wiki/פומפיי</li>
            </ul>
          </div>
          <div>או - הזן מזהה מסמך קיים</div>
          <div>
            <label>מזהה מסמך קיים</label>
            <input
              type="text"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className={twJoin("w-full")}
              value={existingId}
              onChange={(e) => setExistingId(e.target.value)}
            />
            <button onClick={() => loadExistingDocumentById()}>טען טקסט</button>
          </div>
          <div>
            {existingDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => loadExistingDocumentById(doc.id)}
              >
                {doc.title} - {doc.id}
              </div>
            ))}
          </div>
          <div>{error}</div>
        </div>
      )}
    </div>
  );
};

export default DocumentInput;
