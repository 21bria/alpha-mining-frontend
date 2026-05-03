
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

] // cuma keyword
