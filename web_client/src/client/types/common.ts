export type PagingParams = {
  page: number;
  itemsPerPage: number;
};

export type PagedResponse<T> = {
  data: T[];
  total_count: number;
  has_more: boolean;
  page: number;
  items_per_page: number;
};

export type SortConfiguration = {
  sortColumns?: string[];
  sortOrders?: string[];
};

export type SortConfigurationParams = {
  sort?: SortConfiguration;
};

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}
