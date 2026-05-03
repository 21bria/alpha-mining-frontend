
import type { MasterTableConfig } from "@/types/table"

export const weatherConfig: MasterTableConfig = {
  id: "mining-weather",
  endpoint: "/api/mining/daily-weather/",
  defaultQuery: {},
}
