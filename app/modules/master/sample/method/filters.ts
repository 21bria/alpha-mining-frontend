
import type { FilterSchema } from "@/types/table"

export const sampleMethodFilters: FilterSchema[] = [
    {
        key: "sample_type",
        label: "Sample type",
        kind: "select",
        endpoint: "/api/master/lookups/sample-type/",
        multiple: true,
        placement: "top",
    }
]
