export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  const isPublic = Boolean(to.meta.public)

  auth.loadFromStorage()

  if (!auth.isAuthed) {
    if (!isPublic) return navigateTo('/login')
    return
  }

  if (auth.isAuthed && to.path === '/login') return navigateTo('/')

  // fetchMe hanya di client
  if (import.meta.client && !isPublic && !auth.meLoaded) {
    try {
      await auth.fetchMe()
    } catch {
      auth.clear()
      return navigateTo('/login')
    }
  }
})