
import type { MasterTableConfig } from "@/types/table"

export const productionsConfig: MasterTableConfig = {
  id: "mining-productions-list",
  endpoint: "/api/mining/productions/",

  defaultQuery: {},
}

export const productionsCRUDConfig: MasterTableConfig = {
  id: "mining-productions",
  endpoint: "/api/mining/productions-crud/",

  defaultQuery: {},
}
