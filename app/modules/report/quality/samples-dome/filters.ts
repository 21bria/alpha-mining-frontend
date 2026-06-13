
import type { FilterSchema } from "@/types/table"

export const sampleDomeFilters: FilterSchema[] = [
  {
    key: "date_sample",
    label: "Sample Date",
    kind: "daterange",
    startKey: "date_from",
    endKey: "date_to",
    placement: "top",
  },
  {
    key: "sampling_point",
    label: "Dome",
    kind: "select",
    endpoint: "/api/master/lookups/mine-dome/?value_key=pile_id&label_key=pile_id",
    placement: "top",
  },

]
