
import type { MasterTableConfig } from "@/types/table"

export const samplesConfig: MasterTableConfig = {
  id: "geology-samples-geology",
  endpoint: "/api/geology/samples/",

  defaultQuery: {},
}

export const samplesCRUDConfig: MasterTableConfig = {
  id: "geology-samples-geology",
  endpoint: "/api/geology/samples-crud/",

  defaultQuery: {},
}
