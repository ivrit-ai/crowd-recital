import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { getFaqDataOptions } from "@/client/queries/help";

const FAQSection = () => {
  const { t } = useTranslation();
  const { data, isPending } = useQuery(getFaqDataOptions());

  if (isPending) {
    return <div className="loading loading-infinity loading-lg" />;
  }

  if (!data) return null;

  return (
    <div className="prose">
      <h1 className="text-xl">{t("sleek_antsy_beaver_file")}</h1>
      <div dangerouslySetInnerHTML={{ __html: data! }} />{" "}
    </div>
  );
};

export default FAQSection;
