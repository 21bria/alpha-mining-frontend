export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  auth.loadFromStorage()

  if (auth.isAuthed && !auth.meLoaded) {
    try {
      await auth.fetchMe()
    } catch {
      auth.clear()
    }
  }
})