
import type { MasterTableConfig } from "@/types/table"

export const sellingTemporaryConfig: MasterTableConfig = {
  id: "selling-temporary-view",
  endpoint: "/api/selling/temporary/",
  defaultQuery: {},
}
export const sellingTemporaryRUDConfig: MasterTableConfig = {
  id: "temporary-crud",
  endpoint: "/api/selling/temporary-crud/",
  defaultQuery: {},
}
