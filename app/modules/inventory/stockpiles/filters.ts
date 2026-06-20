import type { FilterSchema } from "@/types/table"

export const inventoryFilters: FilterSchema[] = [
    {
        key: "iup_id",
        label: "IUP",
        kind: "select",
        endpoint: "/api/master/lookups/mine-iup/?value_key=id&label_key=iup_name",
        placement: "top",
    },
    {
        key: "material",
        label: "Material",
        kind: "select",
        endpoint: "/api/master/lookups/material/?value_key=name&label_key=name&is_ore=true&is_production=true",
        placement: "top",
    },
    // drawer
    {
        key: "sampling_area",
        label: "Stockpile",
        kind: "select",
        endpoint: "/api/master/lookups/mine-dumping/?value_key=dumping_point&label_key=dumping_point",
        placement: "drawer",
        multiple: true,
        depends: ["iup_id"],
        queryMap: {
            iup_id: "iup_id",
        },
        
    },

]