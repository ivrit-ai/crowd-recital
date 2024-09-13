import {
  SortConfiguration,
  SortConfigurationParams,
  PagingParams,
} from "./types/common";

export function setSortAndPagingQueryParams(
  queryParams: SortConfigurationParams & PagingParams,
  requestQueryParams: URLSearchParams,
) {
  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined) {
      if (key === "sort") {
        const sortValue = value as SortConfiguration;
        if (
          !!sortValue.sortColumns?.length &&
          sortValue.sortOrders?.length == sortValue.sortColumns?.length
        ) {
          for (let i = 0; i < sortValue.sortColumns.length; i++) {
            requestQueryParams.append(`sortColumns`, sortValue.sortColumns[i]);
            requestQueryParams.append(`sortOrders`, sortValue.sortOrders[i]);
          }
        }
      } else if (["page", "itemsPerPage"].includes(key)) {
        requestQueryParams.append(key, value.toString());
      }
    }
  }
}
