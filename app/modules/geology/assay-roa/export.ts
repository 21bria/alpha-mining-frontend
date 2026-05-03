export function buildExportSchema(role: string) {
  const base: any[] = [
    {
      kind: "daterange",
      label: "Date Range",
      startKey: "date_start",
      endKey: "date_end",
    },
  ]

  if (role === "SYSTEM" || role === "MANAGEMENT") {
    base.push({
      kind: "select",
      key: "iup",
      label: "IUP",
      endpoint: "/api/master/lookups/mine-iup/",
    })
  }

  return base
}