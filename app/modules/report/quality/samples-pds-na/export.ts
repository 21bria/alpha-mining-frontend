export function buildExportSchema(role: string) {
  const base: any[] = [
    {
      kind: "daterange",
      label: "Date Range",
      startKey: "date_from",
      endKey: "date_to",
    },
    {
      key: "sampling_point",
      label: "Dome",
      kind: "select",
      endpoint: "/api/master/lookups/mine-dome/?value_key=pile_id&label_key=pile_id",
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