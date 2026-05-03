import type { FilterSchema } from "@/types/table"

export const mralFilters: FilterSchema[] = [
    {
        key: "date_sample",
        label: "Release Date",
        kind: "daterange",
        startKey: "date_sample_from",
        endKey: "date_sample_to",
        placement: "top",
    },
] // cuma keyword
