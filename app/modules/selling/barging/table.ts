
import type { MasterTableConfig } from "@/types/table"

export const sellingBargingConfig: MasterTableConfig = {
  id: "selling-official-view",
  endpoint: "/api/selling/barging/",
  defaultQuery: {},
}
export const sellingBargingCRUDConfig: MasterTableConfig = {
  id: "selling-barging-crud",
  endpoint: "/api/selling/barging-crud/",
  defaultQuery: {},
}
