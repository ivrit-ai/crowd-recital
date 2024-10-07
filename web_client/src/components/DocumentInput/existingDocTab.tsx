import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { Link2Off, RefreshCwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { twJoin } from "tailwind-merge";

import { getDocumentsOptions } from "@/client/queries/documents";
import useLogin from "@/hooks/useLogin";
import { SortOrder } from "@/client/types/common";
import SortCol from "@/components/DataTable/SortCol";
import { useSortState } from "@/components/DataTable/useSortState";
import TablePager from "@/components/TablePager";
import type { TabContentProps } from "./types";

type Props = TabContentProps & {
  setNoDocsFound: (notFound: boolean | null) => void;
};

enum SortColumnsEnum {
  CREATED_AT = "created_at",
}

const itemsPerPage = 10;

const SelectExistingDocument = ({ error, setNoDocsFound }: Props) => {
  const { t } = useTranslation("documents");
  const navigate = useNavigate({ from: "/documents" });
  const [onlyMine, setOnlyMine] = useState(true);
  const [existingId, setExistingId] = useState("");

  // Documents table loading
  const [page, setPage] = useState(1);
  const { auth } = useRouteContext({ strict: false });
  const sortState = useSortState<SortColumnsEnum>(
    SortColumnsEnum.CREATED_AT,
    SortOrder.DESC,
  );
  // Note - non admins are forced on "own user id" so this only applies
  // to admins
  const ownerFilter = onlyMine ? auth?.user?.id : undefined;
  const includePublicFilter = !onlyMine;
  const { data, isError, isPending, isPlaceholderData, refetch, isFetching } =
    useQuery({
      ...getDocumentsOptions(
        page,
        itemsPerPage,
        {
          sortColumns: [sortState.sortCol],
          sortOrders: [sortState.sortOrder],
        },
        ownerFilter,
        includePublicFilter,
      ),
      refetchOnMount: true,
    });

  const docsOnPage = data?.data;
  const totalItems = data?.total_count || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Report to paret if we cannot find any docs
  useEffect(() => {
    if (!isPending) {
      setNoDocsFound(totalItems === 0);
    } else {
      setNoDocsFound(null);
    }
  }, [setNoDocsFound, isPending, totalItems]);

  const refreshButton = (
    <button className="btn btn-xs m-2 sm:btn-sm" onClick={() => refetch()}>
      {isFetching ? (
        <span className="loading loading-infinity loading-sm" />
      ) : (
        <RefreshCwIcon className="h-4 w-4" />
      )}
    </button>
  );

  let tableBody;
  if (!isPending) {
    if (!docsOnPage?.length) {
      tableBody = null;
    } else {
      tableBody = docsOnPage.map((doc) => (
        <tr
          className={twJoin(
            "cursor-pointer hover:bg-base-200",
            isPlaceholderData && "skeleton opacity-50",
          )}
          key={doc.id}
          onClick={() =>
            navigate({ to: "/recite/$docId", params: { docId: doc.id } })
          }
        >
          <td className="text-xs md:text-sm">
            {doc.title}
            {doc.public ? <span className="text-accent"> [ציבורי]</span> : ""}
          </td>
          <td className="hidden text-xs sm:table-cell md:text-sm">{doc.id}</td>
          <td dir="ltr" className="text-xs md:text-sm">
            {new Date(doc.created_at).toLocaleDateString()}
          </td>
        </tr>
      ));
    }
  } else {
    tableBody = [1, 2, 3, 4].map((v) => (
      <tr key={v}>
        <td>
          <div className="skeleton w-24 py-3 sm:w-52"></div>
        </td>
        <td className="hidden sm:table-cell">
          <div className="skeleton w-40 py-3"></div>
        </td>
        <td>
          <div className="skeleton w-32 py-3 sm:w-40"></div>
        </td>
      </tr>
    ));
  }

  const filtersElement = (
    <div className="mb-4 flex flex-row items-center justify-between sm:mx-4">
      <label className="label cursor-pointer">
        <span className="label-text me-4 text-xs sm:text-sm">
          {t("brief_cozy_gull_bloom")}
        </span>
        <input
          type="checkbox"
          className="checkbox-primary checkbox sm:checkbox-xs"
          checked={onlyMine}
          onChange={(e) => setOnlyMine(e.target.checked)}
        />
      </label>
    </div>
  );

  const tableElement = (
    <>
      <div dir="rtl" className="overflow-x-auto">
        <table className="table table-md">
          <thead>
            <tr>
              <th>{t("major_dark_husky_launch")}</th>
              <th className="hidden sm:table-cell">
                {t("many_nimble_tapir_fade")}
              </th>
              <SortCol
                label={t("long_suave_bobcat_succeed")}
                colName={SortColumnsEnum.CREATED_AT}
                {...sortState}
              />
            </tr>
          </thead>
          <tbody>{tableBody}</tbody>
        </table>
      </div>
      <TablePager
        key={totalPages}
        page={page}
        totalPages={totalPages}
        setPage={setPage}
      />
      {isError && (
        <div>
          <div className="alert alert-error text-sm">
            {t("gross_only_llama_play")}
          </div>
        </div>
      )}
    </>
  );

  const noDocsPlaceholder = (
    <div className="text-center">
      <h2 className="my-10 text-center text-lg">
        {t("proof_nimble_puma_dream")}
      </h2>
      <p>{t("short_blue_mink_boost")}</p>
    </div>
  );

  const errorPlaceholder = (
    <div className="text-center text-error">
      <h2 className="my-10 text-center text-lg">ארעה שגיאה</h2>
      <p>{t("bold_active_moose_dream")}</p>
      {refreshButton}
    </div>
  );

  return (
    <>
      <div className="flex flex-row items-center justify-between sm:mx-4">
        <label className="label">{t("house_equal_bird_vent")}</label>
        {refreshButton}
      </div>

      {filtersElement}
      {tableBody
        ? tableElement
        : isError
          ? errorPlaceholder
          : noDocsPlaceholder}
      <div className="divider"></div>
      <div className="flex flex-col justify-end gap-4">
        <label className="label">{t("short_spry_rooster_swim")}</label>
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
              navigate({ to: "/recite/$docId", params: { docId: existingId } })
            }
          >
            {t("warm_next_alligator_laugh")}
          </button>
        </div>
        {!!error && (
          <div role="alert" className="alert alert-error text-sm">
            <Link2Off /> {error}
          </div>
        )}
      </div>
    </>
  );
};

export default SelectExistingDocument;
