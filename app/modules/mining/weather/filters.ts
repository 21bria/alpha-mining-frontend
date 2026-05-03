import type { FilterSchema } from "@/types/table"

export const weatherFilters: FilterSchema[] = [
  {
    key: "category",
    label: "Category",
    kind: "select",
    endpoint: "/api/mining/weather-category/?value_key=value&label_key=label",
    multiple: true,
    placement: "top",
  },
  {
    key: "date",
    label: "Weather Date",
    kind: "daterange",
    startKey: "date_start",
    endKey: "date_end",
    placement: "top",
  },
]