import type { MasterTableConfig } from "@/types/table"

export const mineUnitsConfig: MasterTableConfig = {
  id: "master-mine-units",
  endpoint: "/api/master/mine-units/",
  defaultQuery: {},
}

export const unitAssignmentsConfig: MasterTableConfig = {
  id: "master-unit-assignments",
  endpoint: "/api/master/unit-assignments/",
  defaultQuery: {},
}
