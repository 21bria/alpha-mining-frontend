
import type { MasterTableConfig } from "@/types/table"

export const groupsConfig: MasterTableConfig = {
  id: "account-groups",
  endpoint: "/api/auth/admin/groups/",
  
  defaultQuery: {},
}
