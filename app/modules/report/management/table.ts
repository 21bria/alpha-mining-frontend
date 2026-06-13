
import type { MasterTableConfig } from "@/types/table"

export const reportManagementConfig: MasterTableConfig = {
  id: "report-management",
  endpoint: "/api/analytics/report-management/",
  defaultQuery: {
    ordering: "-period_start",
  },
}