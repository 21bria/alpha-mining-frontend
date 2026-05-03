
import type { FilterSchema } from "@/types/table"

export const mineUnitsFilters: FilterSchema[] = [
      {
        key: "id_category",
        label: "Categories",
        kind: "select",
        endpoint: "/api/master/lookups/units-categories/",
        multiple: true,
        placement: "top",
    }
] // cuma keyword
