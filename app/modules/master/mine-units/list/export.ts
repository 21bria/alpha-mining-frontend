export function buildExportSchema(role: string) {
  const base: any[] = []

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