export type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

export function normalizeRole(v: unknown): UserRole {
  const raw = String(v ?? "").trim().toUpperCase()

  if (raw === "SYSTEM") return "SYSTEM"
  if (raw === "MANAGEMENT") return "MANAGEMENT"
  if (raw === "GLOBAL_VIEWER") return "GLOBAL_VIEWER"
  if (raw === "SITE_USER") return "SITE_USER"

  if (raw === "SUPER_ADMIN" || raw === "SUPERADMIN" || raw === "ADMIN") {
    return "SYSTEM"
  }

  return "SITE_USER"
}