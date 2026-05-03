import type { FilterSchema } from "@/types/table"

export const fillFactorFilters: FilterSchema[] = [
  {
    key: "material",
    label: "Material",
    kind: "select",
    endpoint: "/api/master/lookups/material/?value_key=name&label_key=name",
    multiple: true,
    placement: "top",
  },
  // {
  //   key: "date",
  //   label: "Weather Date",
  //   kind: "daterange",
  //   startKey: "date_from",
  //   endKey: "date_to",
  //   placement: "top",
  // },
]