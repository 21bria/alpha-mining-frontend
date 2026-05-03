import { useAuthStore } from "@/stores/auth"

export function usePermission() {
  const auth = useAuthStore()

  const can = (perm: string) => {
    if (auth.user?.role === "SYSTEM") return true
    return auth.user?.permissions?.includes(perm)
  }

  return { can }
}