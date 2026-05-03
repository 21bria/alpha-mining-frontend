
import type { MasterTableConfig } from "@/types/table"

export const productionsConfig: MasterTableConfig = {
  id: "geology-productions-list",
  endpoint: "/api/geology/productions/",

  defaultQuery: {},
}

export const productionsCRUDConfig: MasterTableConfig = {
  id: "geology-productions",
  endpoint: "/api/geology/productions-crud/",

  defaultQuery: {},
}
