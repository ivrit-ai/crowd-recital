import type {
  PagedResponse,
  PagingParams,
  SortConfiguration,
  SortConfigurationParams,
} from "./types/common";
import type {
  RecitalSessionStatus,
  RecitalSessionType,
  RecitalPreviewType,
} from "@/types/session";
import { reportResponseError } from "@/analytics";

export const alterSessionBaseUrl = "/api/sessions";

export type SessionFilters = {
  status?: RecitalSessionStatus;
};

type RecitalSessionsResponse = PagedResponse<RecitalSessionType>;

export async function getSessions(
  queryParams: PagingParams & SessionFilters & SortConfigurationParams,
): Promise<RecitalSessionsResponse> {
  const requestQueryParams = new URLSearchParams();
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
      } else {
        requestQueryParams.append(key, value.toString());
      }
    }
  }

  const searchQuery = requestQueryParams
    ? `?${requestQueryParams.toString()}`
    : "";

  const response = await fetch(`${alterSessionBaseUrl}${searchQuery}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = await reportResponseError(
      response,
      "session",
      "getSessions",
      "Failed to get user sessions",
    );
    throw new Error(errorMessage);
  }

  return response.json();
}

type GetSessionParams = {
  id: string;
};

export async function getSession(
  queryParams: GetSessionParams,
): Promise<RecitalSessionType> {
  const response = await fetch(`${alterSessionBaseUrl}/${queryParams.id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = await reportResponseError(
      response,
      "session",
      "getSession",
      "Failed to get a session",
    );
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function getSessionPreview(
  queryParams: GetSessionParams,
): Promise<RecitalPreviewType> {
  const response = await fetch(
    `${alterSessionBaseUrl}/${queryParams.id}/preview`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorMessage = await reportResponseError(
      response,
      "session",
      "getSessionPreview",
      "Failed to get a session preview",
    );
    throw new Error(errorMessage);
  }

  return response.json();
}
