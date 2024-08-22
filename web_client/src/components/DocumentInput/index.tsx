import { useCallback, useState, useEffect } from "react";
import { twJoin } from "tailwind-merge";

import type { TextDocumentResponse } from "@/models";
import { getErrorMessage, tw } from "@/utils";
import { Document } from "@/models";
import { useDocuments } from "@/hooks/documents";
import WikiArticleUpload from "./wikiUploadTab";
import SelectExistingDocument from "./existingDocTab";
import { EntryMethods } from "./types";
import type { TabContentProps } from "./types";

const createDocumentUrl = "/api/create_document_from_source";
const loadDocumentsUrl = "/api/documents";

type DocumentManagerProps = {
  setActiveDocument: (document: Document | null) => void;
};

type uploaderThunk<T extends unknown[] = unknown[]> = (
  ...args: T
) => Promise<string>;

const DocumentInput = ({ setActiveDocument }: DocumentManagerProps) => {
  const [existingDocuments, setExistingDocuments] = useState<
    TextDocumentResponse[]
  >([]);
  const [entryMode, setEntryMode] = useState<EntryMethods>(
    EntryMethods.EXISTING,
  );
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const { createWikiArticleDocument, loadDocumentById, loadUserDocuments } =
    useDocuments(createDocumentUrl, loadDocumentsUrl);

  useEffect(() => {
    setProcessing(true);
    loadUserDocuments().then((documents) => {
      setExistingDocuments(documents);
      if (documents.length === 0) setEntryMode(EntryMethods.WIKI);
      setProcessing(false);
    });
  }, [setProcessing, setEntryMode, loadUserDocuments, setExistingDocuments]);

  useEffect(() => {
    setError("");
  }, [entryMode]);

  const uploadWrapper = <T extends unknown[]>(uploader: uploaderThunk<T>) => {
    return async (...args: T) => {
      setProcessing(true);
      try {
        const docId = await uploader(...args);
        const doc = await loadDocumentById(docId);
        setActiveDocument(Document.fromTextDocument(doc));
        setError("");
      } catch (error) {
        setError(`${getErrorMessage(error)} - ארעה שגיאה בעת יצירת מסמך הטקסט`);
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
    setEntryMode,
  };

  const baseTabStyles = tw("tab hidden md:flex");

  return (
    <div className="container mx-auto max-w-4xl self-stretch px-4 py-12">
      <h1 className="pb-6 text-2xl">בחירת טקסט להקראה</h1>

      {/* Tab title in smaller screens uses an horizontal menu */}
      <ul className="menu menu-horizontal menu-xs md:hidden [&>li]:mb-1 [&>li]:ms-1 [&>li]:rounded [&>li]:bg-slate-100">
        <li onClick={() => setEntryMode(EntryMethods.EXISTING)}>
          <a
            className={twJoin(entryMode === EntryMethods.EXISTING && "active")}
          >
            מסמך קיים
          </a>
        </li>
        <li onClick={() => setEntryMode(EntryMethods.WIKI)}>
          <a className={twJoin(entryMode === EntryMethods.WIKI && "active")}>
            טען מאמר ויקיפדיה
          </a>
        </li>
        <li className="disabled">
          <a>
            העלה מסמך <span className="badge badge-info badge-sm">בקרוב</span>
          </a>
        </li>
        <li className="disabled">
          <a>
            הדבק טקסט חופשי{" "}
            <span className="badge badge-info badge-sm">בקרוב</span>
          </a>
        </li>
      </ul>

      <div role="tablist" className="tabs tabs-xs md:tabs-lifted md:tabs-md">
        <div
          role="tab"
          className={twJoin(
            baseTabStyles,
            entryMode === EntryMethods.EXISTING && "tab-active",
          )}
          onClick={() => setEntryMode(EntryMethods.EXISTING)}
        >
          מסמך קיים
        </div>
        <div role="tabpanel" className="tab-content">
          <SelectExistingDocument
            {...tabContentProps}
            existingDocuments={existingDocuments}
            loadExistingDocumentById={loadExistingDocumentById}
          />
        </div>
        <div
          role="tab"
          className={twJoin(
            baseTabStyles,
            entryMode === EntryMethods.WIKI && "tab-active",
          )}
          onClick={() => setEntryMode(EntryMethods.WIKI)}
        >
          טען מאמר ויקיפדיה
        </div>
        <div role="tabpanel" className="tab-content">
          <WikiArticleUpload
            {...tabContentProps}
            loadNewDocumentFromWikiArticle={loadNewDocumentFromWikiArticle}
          />
        </div>
        <div role="tab" className={twJoin(baseTabStyles, "tab-disabled")}>
          העלה מסמך (בקרוב)
        </div>
        <div role="tab" className={twJoin(baseTabStyles, "tab-disabled")}>
          הדבק טקסט חופשי (בקרוב)
        </div>
      </div>
    </div>
  );
};

export default DocumentInput;
