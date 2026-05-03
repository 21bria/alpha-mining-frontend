
import type { FilterSchema } from "@/types/table"

export const productionsFilters: FilterSchema[] = [
    {
    key: "material",
    label: "Material",
    kind: "select",
    endpoint: "/api/master/lookups/material/?value_key=name&label_key=name&category=ORE",
    multiple: true,
    placement: "top",
  },
  {
    key: "tgl_production",
    label: "Productions Date",
    kind: "daterange",
    startKey: "tgl_production_from",
    endKey: "tgl_production_to",
    placement: "top",
  },
  // drawer
  {
    key: "sampling_area",
    label: "Stockpile",
    kind: "select",
    endpoint: "/api/master/lookups/mine-dumping/?value_key=dumping_point&label_key=dumping_point",
    placement: "drawer",
  },
{
  key: "pile_id",
  label: "Dome",
  kind: "select",
  endpoint: "/api/master/lookups/mine-dome/?value_key=pile_id&label_key=pile_id",
  depends: ["sampling_area"],
  queryMap: {
    sampling_area: "dumping_id",
  },
  placement: "drawer",
}
] 
