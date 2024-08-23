import { useCallback, useState } from "react";

import { TextDocumentResponse } from "@/models";
import { EntryMethods } from "./types";
import type { TabContentProps } from "./types";

interface Props extends TabContentProps {
  existingDocuments: TextDocumentResponse[];
  loadExistingDocumentById: (id: string) => Promise<void>;
}

const SelectExistingDocument = ({
  processing,
  setEntryMode,
  existingDocuments,
  loadExistingDocumentById,
}: Props) => {
  const [existingId, setExistingId] = useState("");

  const select = useCallback(() => {
    loadExistingDocumentById(existingId);
  }, [loadExistingDocumentById, existingId]);

  let tableBody;
  if (!processing) {
    if (existingDocuments.length === 0) {
      tableBody = null;
    } else {
      tableBody = existingDocuments.map((doc) => (
        <tr
          key={doc.id}
          onClick={() => loadExistingDocumentById(doc.id)}
          className="cursor-pointer hover:bg-base-200"
        >
          <td className="text-xs md:text-sm">{doc.title}</td>
          <td className="text-xs md:text-sm">{doc.id}</td>
          <td className="text-xs md:text-sm">
            {new Date(doc.created_at).toLocaleString()}
          </td>
        </tr>
      ));
    }
  } else {
    tableBody = [1, 2, 3, 4].map((v) => (
      <tr key={v}>
        <td>
          <div className="skeleton w-52 py-3"></div>
        </td>
        <td>
          <div className="skeleton w-40 py-3"></div>
        </td>
        <td>
          <div className="skeleton w-40 py-3"></div>
        </td>
      </tr>
    ));
  }

  const tableElement = (
    <>
      <label className="label">בחר מסמך קיים</label>
      <div dir="rtl" className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>כותרת</th>
              <th>מזהה</th>
              <th>נוצר</th>
            </tr>
          </thead>
          <tbody>{tableBody}</tbody>
        </table>
      </div>
    </>
  );

  const noDocsPlaceholder = (
    <div className="text-center">
      <h2 className="my-10 text-center text-lg">אין מסמכים קיימים עדיין</h2>
      <button
        className="btn btn-primary btn-sm"
        onClick={() => setEntryMode(EntryMethods.WIKI)}
      >
        טען מאמר ויקיפדיה
      </button>
    </div>
  );

  return (
    <>
      {tableBody ? tableElement : noDocsPlaceholder}
      <div className="divider"></div>
      <div className="flex flex-col justify-end gap-4">
        <label className="label">הזן מזהה מסמך קיים</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="input input-sm input-bordered w-full max-w-xl"
            value={existingId}
            onChange={(e) => setExistingId(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" onClick={() => select()}>
            טען טקסט
          </button>
        </div>
      </div>
    </>
  );
};

export default SelectExistingDocument;
