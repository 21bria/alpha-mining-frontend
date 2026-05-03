import type { FilterSchema } from "@/types/table"

export const roaFilters: FilterSchema[] = [
    {
        key: "release_date",
        label: "Release Date",
        kind: "daterange",
        startKey: "date_start",
        endKey: "date_end",
        placement: "top",
    },
] // cuma keyword
