import { useState } from "react";

import { SortOrder } from "@/client/types/common";

export const useSortState = <ColsEnum>(
  initialSortCol: ColsEnum,
  initialSortOrder: SortOrder,
) => {
  const [sortCol, setSortCol] = useState(initialSortCol);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);

  return { sortCol, sortOrder, setSortCol, setSortOrder } as const;
};
