import type { FilterSchema } from "@/types/table"

export const sellingBargingFilters: FilterSchema[] = [
  {
    key: "material",
    label: "Material",
    kind: "select",
    endpoint: "/api/master/lookups/material/?value_key=name&label_key=name&is_ore=true&is_production=true",
    multiple: true,
    placement: "top",
  },
  {
    key: "date_hauling",
    label: "Barging Date",
    kind: "daterange",
    startKey: "date_hauling_from",
    endKey: "date_hauling_to",
    placement: "top",
  },
  {
    key: "stockpile",
    label: "Stockpile",
    kind: "select",
    endpoint: "/api/master/lookups/mine-dumping/?value_key=dumping_point&label_key=dumping_point",
    placement: "drawer",
  },
  {
    key: "dome",
    label: "Dome",
    kind: "select",
    endpoint: "/api/master/lookups/mine-dome/?value_key=pile_id&label_key=pile_id",
    depends: ["stockpile"],
    queryMap: {
      stockpile: "dumping_id",
    },
    placement: "drawer",
  },
  {
    key: "barge_code",
    label: "Barge",
    kind: "select",
    endpoint: "/api/master/lookups/barge/?value_key=barge_code&label_key=barge_code",
    placement: "drawer",
  },
  {
    key: "code_lot",
    label: "Selling Code",
    kind: "select",
    endpoint: "/api/master/lookups/selling-code/?value_key=code&label_key=code",
    placement: "drawer",
  },
]