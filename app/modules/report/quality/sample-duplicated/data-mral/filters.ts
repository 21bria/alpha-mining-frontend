
import type { FilterSchema } from "@/types/table"

export const duplicatedSampleFilters: FilterSchema[] = [
    {
        key: "release_date",
        label: "Release Date",
        kind: "daterange",
        startKey: "start_date",
        endKey: "end_date",
        placement: "top",
    },
] // cuma keyword
