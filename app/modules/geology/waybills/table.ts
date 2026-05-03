
import type { MasterTableConfig } from "@/types/table"

export const waybillsConfig: MasterTableConfig = {
  id: "geology-waybills",
  endpoint: "/api/geology/waybills/",
  defaultQuery: {},
}

export const waybillsCRUDConfig: MasterTableConfig = {
  id: "geology-waybills",
  endpoint: "/api/geology/waybills-crud/",
  defaultQuery: {},
}
