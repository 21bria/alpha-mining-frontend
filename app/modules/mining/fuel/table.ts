
import type { MasterTableConfig } from "@/types/table"

export const fuelDailyConfig: MasterTableConfig = {
  id: "mining-fuel-list",
  endpoint: "/api/mining/fuel-daily/",

  defaultQuery: {},
}

export const fuelDailyCRUDConfig: MasterTableConfig = {
  id: "mining-fuel-crud",
  endpoint: "/api/mining/fuel-daily-crud/",

  defaultQuery: {},
}
