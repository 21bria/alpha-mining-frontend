
import type { FilterSchema } from "@/types/table"

export const productionsFilters: FilterSchema[] = [
  {
    key: "date_production",
    label: "Productions Date",
    kind: "daterange",
    startKey: "date_production_from",
    endKey: "date_production_to",
    placement: "top",
  },
  // drawer
  {
    key: "loading_point",
    label: "Loading point",
    kind: "select",
    endpoint: "/api/master/lookups/mine-loading/?value_key=loading_point&label_key=loading_point",
    placement: "drawer",
  },
  {
    key: "dumping_point",
    label: "Dumping point",
    kind: "select",
    endpoint: "/api/master/lookups/mine-dumping/?value_key=dumping_point&label_key=dumping_point",
    placement: "drawer",
  },


] // cuma keyword
