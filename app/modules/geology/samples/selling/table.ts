
import type { MasterTableConfig } from "@/types/table"

export const samplesConfig: MasterTableConfig = {
  id: "selling-samples",
  endpoint: "/api/selling/samples/",

  defaultQuery: {},
}

export const samplesCRUDConfig: MasterTableConfig = {
  id: "selling-samples",
  endpoint: "/api/selling/samples-crud/",

  defaultQuery: {},
}
