import { computed } from "vue"
import { normalizeRole, type UserRole } from "@/utils/roles"

export function useCurrentRole() {
  const authStore = useAuthStore()

  const currentRole = computed<UserRole>(() =>
    normalizeRole(authStore.user?.role)
  )

  const isSystem = computed(() => currentRole.value === "SYSTEM")
  const isManagement = computed(() => currentRole.value === "MANAGEMENT")
  const isGlobalViewer = computed(() => currentRole.value === "GLOBAL_VIEWER")
  const isSiteUser = computed(() => currentRole.value === "SITE_USER")

  const canMutate = computed(() => currentRole.value !== "GLOBAL_VIEWER")
  const canSeeIup = computed(() => currentRole.value !== "SITE_USER")

  return {
    currentRole,
    isSystem,
    isManagement,
    isGlobalViewer,
    isSiteUser,
    canMutate,
    canSeeIup,
  }
}