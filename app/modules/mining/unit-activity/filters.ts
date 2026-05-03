
import type { FilterSchema } from "@/types/table"

export const activityUnitsFilters: FilterSchema[] = [
    {
        key: "date",
        label: "Date",
        kind: "daterange",
        startKey: "date_start",
        endKey: "date_end",
        placement: "top",
    },
] // cuma keyword
