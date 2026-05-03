
import type { FilterSchema } from "@/types/table"

export const samplesFilters: FilterSchema[] = [
  {
    key: "date_sample",
    label: "Sample Date",
    kind: "daterange",
    startKey: "date_sample_from",
    endKey: "date_sample_to",
    placement: "top",
  },
  // drawer
  {
    key: "sampling_area",
    label: "Sampling area",
    kind: "select",
    endpoint: "/api/master/lookups/mine-dumping/?value_key=dumping_point&label_key=dumping_point",
    placement: "drawer",
  },

// {
//   key: "sampling_point",
//   label: "Sampling Point",
//   kind: "select",
//   endpoint: "/api/master/lookups/mine-dome/",
//   depends: ["sampling_area"],
//   queryMap: {
//     sampling_area: "dumping_id",
//   },
//   placement: "drawer",
// }
{
  key: "sampling_point",
  label: "Sampling Point",
  kind: "select",
  endpoint: "/api/master/lookups/mine-dome/?value_key=pile_id&label_key=pile_id",
  depends: ["sampling_area"],
  queryMap: {
    sampling_area: "dumping_id",
  },
  placement: "drawer",
}
] // cuma keyword
