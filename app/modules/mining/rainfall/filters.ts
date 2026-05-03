import type { FilterSchema } from "@/types/table"

export const rainfallFilters: FilterSchema[] = [
  {
    key: "point_id",
    label: "Point locations",
    kind: "select",
    endpoint: "/api/master/lookups/rainfall-points/?value_key=id&label_key=name",
    multiple: true,
    placement: "top",
  },
  {
    key: "date",
    label: "Rainfall Date",
    kind: "daterange",
    startKey: "date_start",
    endKey: "date_end",
    placement: "top",
  },
]