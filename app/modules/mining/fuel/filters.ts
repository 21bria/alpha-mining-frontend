
import type { FilterSchema } from "@/types/table"

export const fuelDailyFilters: FilterSchema[] = [
  {
    key: "date",
    label: "Recording date",
    kind: "daterange",
    startKey: "date_from",
    endKey: "date_to",
    placement: "top",
  },
  // drawer
  {
    key: "code",
    label: "Vendors",
    kind: "select",
    endpoint: "/api/master/lookups/vendors/?value_key=code&label_key=vendor_name",
    placement: "drawer",
  },

{
  key: "category",
  label: "Catergories",
  kind: "select",
  endpoint: "/api/master/lookups/units-categories/?value_key=category&label_key=category",
  placement: "drawer",
}

] // cuma keyword
