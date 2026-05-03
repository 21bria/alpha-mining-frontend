import type { FilterSchema } from "@/types/table"

export const waybillsFilters: FilterSchema[] = [
//   {
//     key: "roa_order",
//     label: "RO Status",
//     kind: "static-select",
//     options: [
//       { label: "Yes", value: "yes" },
//       { label: "No", value: "no" },
//     ],
//     // multiple: true,
//     placement: "top",
//   },
//   {
//     key: "mral_order",
//     label: "MRAL Status",
//     kind: "static-select",
//     options: [
//       { label: "Yes", value: "yes" },
//       { label: "No", value: "no" },
//     ],
//     // multiple: true,
//     placement: "top",
//   },
  {
    key: "tgl_deliver",
    label: "Deliver Date",
    kind: "daterange",
    startKey: "date_start",
    endKey: "date_end",
    placement: "top",
  }
]