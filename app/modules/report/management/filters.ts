
import type { FilterSchema } from "@/types/table"

export const reportManagementFilters: FilterSchema[] = [
  {
    key: "weekly_date",
    label: "Date",
    kind: "daterange",
    startKey: "period_start",
    endKey: "period_end",
    placement: "top",
  },
]