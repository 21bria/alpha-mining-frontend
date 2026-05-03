
import type { MasterTableConfig } from "@/types/table"

export const usersConfig: MasterTableConfig = {
  id: "account-users",
  endpoint: "/api/auth/admin/users/",

  defaultQuery: {},
}
