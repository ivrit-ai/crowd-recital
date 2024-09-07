import { ArrowDown10Icon, ArrowUp10Icon } from "lucide-react";

import { SortOrder } from "@/client/types/common";

type SortColProps<ColEnum> = {
  label: string;
  colName: ColEnum;
  sortCol: ColEnum;
  sortOrder: SortOrder;
  setSortCol: (colName: ColEnum) => void;
  setSortOrder: (order: SortOrder) => void;
};

const SortCol = <ColEnum,>({
  label,
  colName,
  sortCol,
  sortOrder,
  setSortCol,
  setSortOrder,
}: SortColProps<ColEnum>) => (
  <th
    onClick={() => {
      setSortCol(colName);
      setSortOrder(
        sortOrder === SortOrder.DESC ? SortOrder.ASC : SortOrder.DESC,
      );
    }}
  >
    <div className="btn btn-ghost flex gap-2">
      {label}{" "}
      {colName == sortCol &&
        (sortOrder == SortOrder.DESC ? (
          <ArrowDown10Icon className="h-6 w-6" />
        ) : (
          <ArrowUp10Icon className="h-6 w-6" />
        ))}
    </div>
  </th>
);

export default SortCol;
