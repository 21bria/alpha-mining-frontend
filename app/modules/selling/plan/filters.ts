import type { FilterSchema } from "@/types/table"

export const planProductionsFilters: FilterSchema[] = [
    {
        key: "date_plan",
        label: "Date",
        kind: "daterange",
        startKey: "date_start",
        endKey: "date_end",
        placement: "top",
    },

] // cuma keyword
