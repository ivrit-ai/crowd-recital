import { tw } from "@/utils";
import { twJoin } from "tailwind-merge";

const pagePagesFromEitherSide = 2;

type PagerProps = {
  page: number;
  totalPages: number;
  setPage: (page: number | ((page: number) => number)) => void;
};

const TablePager = ({ page, totalPages, setPage }: PagerProps) => {
  const safePageStep = (page: number, step: number) => {
    return Math.min(Math.max(1, page + step), totalPages);
  };

  if (totalPages === 1) return;

  let firstPage = Math.max(1, page - pagePagesFromEitherSide);
  const lastPage = Math.min(
    firstPage + 2 * pagePagesFromEitherSide,
    totalPages,
  );
  firstPage = Math.max(1, lastPage - 2 * pagePagesFromEitherSide);
  const pagesToShow = Array.from(
    { length: lastPage - firstPage + 1 },
    (_, i) => i + firstPage,
  );

  if (firstPage !== 1) {
    pagesToShow[0] = 1;
    pagesToShow[1] = -1; // Placeholder for all pages in range
  }
  if (lastPage !== totalPages) {
    pagesToShow[pagesToShow.length - 1] = totalPages;
    pagesToShow[pagesToShow.length - 2] = -2; // Placeholder for all pages in range
  }

  const btnBaseClassName = tw("btn join-item btn-sm");

  return (
    <div className="flex justify-center">
      <div className="join mx-4 my-4">
        <button
          className={btnBaseClassName}
          onClick={() => setPage((page) => safePageStep(page, -1))}
        >
          קודם
        </button>
        {pagesToShow.map((pageId) =>
          pageId === -1 || pageId === -2 ? (
            <button
              className={twJoin(btnBaseClassName, "btn-disabled")}
              disabled
              key={pageId}
            >
              ...
            </button>
          ) : (
            <button
              key={pageId}
              className={twJoin(
                btnBaseClassName,
                pageId === page && "btn-active",
              )}
              onClick={() => setPage(pageId)}
            >
              {pageId}
            </button>
          ),
        )}

        <button
          className={btnBaseClassName}
          onClick={() => setPage((page) => safePageStep(page, 1))}
        >
          הבא
        </button>
      </div>
    </div>
  );
};

export default TablePager;
