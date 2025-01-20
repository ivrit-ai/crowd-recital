import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const EnterExistingDocument = () => {
  const { t } = useTranslation("documents");
  const navigate = useNavigate({ from: "/documents" });

  const [existingId, setExistingId] = useState("");

  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        className="input input-sm input-bordered w-full max-w-xl"
        value={existingId}
        onChange={(e) => setExistingId(e.target.value)}
      />
      <button
        className="btn btn-primary btn-sm"
        onClick={() =>
          navigate({
            to: "/recite/$docId",
            params: { docId: existingId },
          })
        }
      >
        {t("warm_next_alligator_laugh")}
      </button>
    </div>
  );
};

export default EnterExistingDocument;
