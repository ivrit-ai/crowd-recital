import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { getErrorMessage } from "@/utils";
import { useDocuments } from "@/hooks/documents";
import useLogin from "@/hooks/useLogin";
import Collapse from "@/components/Collapse";
import WikiArticleUpload from "./wikiUploadTab";
import SelectExistingDocument from "./existingDocTab";
import type { TabContentProps } from "./types";

const DocumentInput = () => {
  const { t } = useTranslation("documents");
  const { activeUser } = useLogin();
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
      setError(t("caring_polite_ape_amuse", { error: getErrorMessage(error) }));
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

  const isAdmin = activeUser?.isAdmin();

  return (
    <div className="container mx-auto max-w-4xl self-stretch px-4 py-12">
      <h1 className="pb-6 text-2xl">{t("mad_weird_sheep_stab")}</h1>

      {noDocsFound === null && (
        <div className="my-11 text-center">
          <span className="loading loading-infinity w-24"></span>
        </div>
      )}

      <Collapse title={t("moving_drab_lark_compose")} defaultOpen={true}>
        <SelectExistingDocument
          {...tabContentProps}
          setNoDocsFound={setNoDocsFound}
        />
      </Collapse>

      {isAdmin && noDocsFound !== null && (
        <>
          <Collapse title={t("teal_loved_stork_buy")} defaultOpen={noDocsFound}>
            <WikiArticleUpload
              {...tabContentProps}
              loadNewDocumentFromWikiArticle={uploadWikiDocument}
            />
          </Collapse>
          <Collapse title={t("icy_loud_stork_catch")} disabled></Collapse>
          <Collapse title={t("cuddly_dull_toucan_fulfill")} disabled></Collapse>
        </>
      )}
    </div>
  );
};

export default DocumentInput;
