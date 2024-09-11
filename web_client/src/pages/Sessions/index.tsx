import { useCallback, useEffect, useRef, useState } from "react";
import { HeadphonesIcon, RefreshCwIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { twJoin } from "tailwind-merge";
import { Link } from "@tanstack/react-router";

import SortCol from "@/components/DataTable/SortCol";
import { SortOrder } from "@/client/types/common";
import { useSortState } from "@/components/DataTable/useSortState";
import { getSessionsOptions } from "@/client/queries/sessions";
import { RecitalSessionStatus } from "@/types/session";
import WholePageLoading from "@/components/WholePageLoading";
import StatusDisplay from "@/components/SessionStatusDisplay";
import TablePager from "@/components/TablePager";
import SessionPreview from "@/components/SessionPreview";

type RecordNowCtaProps = {
  ctaText: string;
};

const RecordNowCta = ({ ctaText }: RecordNowCtaProps) => {
  return (
    <Link to="/docs" className="btn btn-primary">
      {ctaText}
    </Link>
  );
};

const NoRecordingsHero = () => {
  return (
    <div className="container hero mx-auto min-h-screen-minus-topbar">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold">בינתיים, אין שום הקלטות 🤦🏾‍♂️</h1>
          <p className="py-6">אבל מומלץ בחום להקליט אחת עכשיו!</p>
          <RecordNowCta ctaText="בחר טקסט להקלטה" />
        </div>
      </div>
    </div>
  );
};

const itemsPerPage = 8;

enum SortColumnsEnum {
  CREATED_AT = "created_at",
  UPDATED_AT = "updated_at",
}

const Sessions = () => {
  // Sessions Table Data
  const [page, setPage] = useState(1);
  const sortState = useSortState<SortColumnsEnum>(
    SortColumnsEnum.CREATED_AT,
    SortOrder.DESC,
  );
  const { data, isError, isPending, isPlaceholderData, refetch, isFetching } =
    useQuery({
      ...getSessionsOptions(page, itemsPerPage, undefined, {
        sortColumns: [sortState.sortCol],
        sortOrders: [sortState.sortOrder],
      }),
      refetchInterval: 15000,
      refetchOnMount: "always",
    });

  const totalItems = data?.total_count || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Session Preview State
  const sessionPreviewRef = useRef<HTMLDialogElement>(null);
  const [previewedSessionId, setPreviewedSessionId] = useState<string>("");
  useEffect(() => {
    if (previewedSessionId) {
      sessionPreviewRef.current?.showModal();
    }
    return () => {
      sessionPreviewRef.current?.close();
    };
  }, [previewedSessionId]);
  const onClose = useCallback(() => setPreviewedSessionId(""), []);

  if (isPending) {
    return <WholePageLoading />;
  }

  if (isError) {
    return <div>ארעה בעיה בטעינת המידע</div>;
  }

  if (totalItems === 0) {
    return <NoRecordingsHero />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mx-4 mb-4 flex items-center justify-between">
        <h1 className="text-2xl">הקלטות</h1>
        <button className="btn btn-xs m-2 sm:btn-sm" onClick={() => refetch()}>
          {isFetching ? (
            <span className="loading loading-infinity loading-sm" />
          ) : (
            <RefreshCwIcon className="h-4 w-4" />
          )}
        </button>
      </div>
      <div dir="rtl" className="overflow-x-scroll">
        <table className="table table-auto">
          <thead>
            <tr>
              <th>סשן</th>
              <th>סטטוס</th>
              <th></th>
              <SortCol
                label="נוצר"
                colName={SortColumnsEnum.CREATED_AT}
                {...sortState}
              />
              <SortCol
                label="עודכן"
                colName={SortColumnsEnum.UPDATED_AT}
                {...sortState}
              />
              <th>מסמך טקסט</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((rs) => (
              <tr
                className={twJoin(
                  "hover:bg-base-200",
                  isPlaceholderData && "skeleton opacity-50",
                )}
                key={rs.id}
              >
                <td className="text-xs sm:text-sm">{rs.id}</td>
                <td>
                  <StatusDisplay status={rs.status} />
                </td>
                <td>
                  {rs.status == RecitalSessionStatus.Uploaded ? (
                    <button
                      onClick={() => setPreviewedSessionId(rs.id)}
                      className="btn btn-outline btn-sm sm:btn-xs sm:gap-2"
                    >
                      <div className="hidden sm:block">השמע</div>
                      <HeadphonesIcon className="h-4 w-4 sm:h-4 sm:w-4" />
                    </button>
                  ) : (
                    <div className="min-w-24" />
                  )}
                </td>
                <td>{new Date(rs.created_at).toLocaleString()}</td>
                <td>{new Date(rs.updated_at).toLocaleString()}</td>
                <td>{rs.document?.title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePager
        key={totalPages}
        page={page}
        totalPages={totalPages}
        setPage={setPage}
      />
      <div className="sticky my-6 text-center">
        <RecordNowCta ctaText="הקלט עכשיו" />
      </div>
      <SessionPreview
        id={previewedSessionId}
        ref={sessionPreviewRef}
        onClose={onClose}
      />
    </div>
  );
};

export default Sessions;
