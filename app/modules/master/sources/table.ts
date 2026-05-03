// modules/hr/banks/table.ts
import type { MasterTableConfig } from "@/types/table"

export const mineSourceConfig: MasterTableConfig = {
  id: "master-sources",
  endpoint: "/api/master/mine-sources/",
  defaultQuery: {},
}
