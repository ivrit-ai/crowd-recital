import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { getErrorMessage } from "@/utils";
import { useDocuments } from "@/hooks/documents";
import useLogin from "@/hooks/useLogin";
import Collapse from "@/components/Collapse";
import WikiArticleUpload from "./wikiUploadTab";
import FreeTextUpload from "./freeTextUploadTab";
import SelectExistingDocument from "./existingDocTab";
import EnterExistingDocTab from "./enterExistingDocTab";
import type { TabContentProps } from "./types";

const DocumentInput = () => {
  const { t } = useTranslation("documents");
  const { activeUser } = useLogin();
  const navigate = useNavigate({ from: "/documents" });
  const [noDocsFound, setNoDocsFound] = useState<boolean | null>(null);
  const [processing, setProcessing] = useState(false);
  const [wikiUploadError, setWikiUploadError] = useState("");
  const [freeTextUploadError, setFreeTextUploadError] = useState("");
  const queryClient = useQueryClient();

  const { createWikiArticleDocument, createFreeTextDocument } = useDocuments();

  const uploadWikiDocument = useCallback(
    async (wikiArticleUrl: string) => {
      setProcessing(true);
      try {
        const decodedUrl = decodeURIComponent(wikiArticleUrl);
        const { id } = await createWikiArticleDocument(decodedUrl);
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        navigate({ to: "/recite/$docId", params: { docId: id } });
        setWikiUploadError("");
      } catch (error) {
        setWikiUploadError(
          t("caring_polite_ape_amuse", { error: getErrorMessage(error) }),
        );
        console.error("---");
        console.error(error);
        console.log(getErrorMessage(error));
        console.error("===");
      } finally {
        setProcessing(false);
      }
    },
    [createWikiArticleDocument],
  );

  const uploadFreeTextDocument = useCallback(
    async (text: string, title?: string) => {
      setProcessing(true);
      try {
        const { id } = await createFreeTextDocument(text, title);
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        navigate({ to: "/recite/$docId", params: { docId: id } });
        setFreeTextUploadError("");
      } catch (error) {
        setFreeTextUploadError(
          t("caring_polite_ape_amuse", { error: getErrorMessage(error) }),
        );
        console.error(error);
      } finally {
        setProcessing(false);
      }
    },
    [createFreeTextDocument],
  );

  const tabContentProps: TabContentProps = {
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

      {noDocsFound !== null && (
        <>
          <Collapse title={t("teal_loved_stork_buy")} defaultOpen={noDocsFound}>
            <WikiArticleUpload
              error={wikiUploadError}
              setError={setWikiUploadError}
              {...tabContentProps}
              loadNewDocumentFromWikiArticle={uploadWikiDocument}
            />
          </Collapse>
          <Collapse title={t("short_spry_rooster_swim")} defaultOpen={false}>
            <EnterExistingDocTab />
          </Collapse>
          {isAdmin && (
            <>
              <Collapse title={t("cuddly_dull_toucan_fulfill")}>
                <FreeTextUpload
                  error={freeTextUploadError}
                  setError={setFreeTextUploadError}
                  {...tabContentProps}
                  loadNewDocumentFromFreeText={uploadFreeTextDocument}
                />
              </Collapse>
              <Collapse title={t("icy_loud_stork_catch")} disabled></Collapse>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentInput;
