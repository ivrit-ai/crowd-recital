export class APIError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;

    Object.setPrototypeOf(this, APIError.prototype);
  }
}

export class APINotFoundError extends APIError {
  constructor(message: string) {
    super(message, 404);
    Object.setPrototypeOf(this, APINotFoundError.prototype);
  }
}

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
