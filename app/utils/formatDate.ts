export function formatDateTime(val?: string | null) {
  if (!val) return "-"

  return new Date(val).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDate(val?: string | null) {
  if (!val) return "-"

  return new Date(val).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}