import { defineStore } from "pinia"

type LoginResponse = {
  access: string
  refresh: string
  // login boleh tidak kirim user lengkap (permissions biasanya belum ada)
  user?: any
  iup_access?: any
}

type MeResponse = {
  user: any
  iup_access: any
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    access: "" as string,
    refresh: "" as string,
    user: null as any,
    iupAccess: null as any,

    // meLoaded = user + permissions sudah siap
    meLoaded: false as boolean,

    // iupLoaded = iupAccess sudah siap
    iupLoaded: false as boolean,

    mePromise: null as Promise<any> | null,
  }),

  getters: {
    isAuthed: (s) => !!s.access,
  },

  actions: {
    loadFromStorage() {
      const accessCookie = useCookie<string | null>("access", { sameSite: "lax" })
      const refreshCookie = useCookie<string | null>("refresh", { sameSite: "lax" })

      this.access = accessCookie.value ?? ""
      this.refresh = refreshCookie.value ?? ""

      if (import.meta.server) return

      const safeParse = (v: string | null) => {
        if (!v || v === "undefined" || v === "null") return null
        try {
          return JSON.parse(v)
        } catch {
          return null
        }
      }

      this.user = safeParse(localStorage.getItem("user"))
      this.iupAccess = safeParse(localStorage.getItem("iupAccess"))

      const hasPerms = Array.isArray(this.user?.permissions)

      // identity siap kalau sudah ada permissions
      this.meLoaded = !!(this.access && this.user && hasPerms)

      // iup siap kalau ada iupAccess
      this.iupLoaded = !!(this.access && this.iupAccess)
    },

    saveToStorage() {
      const accessCookie = useCookie<string | null>("access", { sameSite: "lax" })
      const refreshCookie = useCookie<string | null>("refresh", { sameSite: "lax" })

      accessCookie.value = this.access ? this.access : null
      refreshCookie.value = this.refresh ? this.refresh : null

      if (import.meta.server) return

      if (this.user == null) localStorage.removeItem("user")
      else localStorage.setItem("user", JSON.stringify(this.user))

      if (this.iupAccess == null) localStorage.removeItem("iupAccess")
      else localStorage.setItem("iupAccess", JSON.stringify(this.iupAccess))
    },

    clear() {
      const accessCookie = useCookie<string | null>("access", { sameSite: "lax" })
      const refreshCookie = useCookie<string | null>("refresh", { sameSite: "lax" })

      accessCookie.value = null
      refreshCookie.value = null

      this.access = ""
      this.refresh = ""
      this.user = null
      this.iupAccess = null
      this.meLoaded = false
      this.iupLoaded = false
      this.mePromise = null

      if (import.meta.client) {
        localStorage.removeItem("user")
        localStorage.removeItem("iupAccess")
      }
    },

    async login(username: string, password: string) {
      const config = useRuntimeConfig()
      const baseURL = config.public.apiBaseUrl

      try {
        const res = await $fetch<LoginResponse>(`${baseURL}/api/auth/login/`, {
          method: "POST",
          body: { username, password },
        })

        // simpan token dulu
        this.access = res.access
        this.refresh = res.refresh

        // optional: kalau login mengirim user/iup_access, simpan dulu (boleh)
        this.user = res.user ?? this.user
        this.iupAccess = res.iup_access ?? this.iupAccess

        // PENTING: jangan anggap meLoaded true sebelum ada permissions
        this.meLoaded = false
        this.iupLoaded = !!(this.access && this.iupAccess)

        this.saveToStorage()

        // WAJIB: ambil /me supaya permissions masuk
        await this.fetchMe()
      } catch (e: any) {
        const msg =
          e?.data?.detail ||
          (Array.isArray(e?.data?.non_field_errors) ? e.data.non_field_errors[0] : null) ||
          "Username atau password salah"
        throw new Error(msg)
      }
    },

    async fetchMe() {
      const hasPerms = Array.isArray(this.user?.permissions)
      if (this.meLoaded && hasPerms) {
        return { user: this.user, iup_access: this.iupAccess }
      }
      if (this.mePromise) return this.mePromise

      this.mePromise = (async () => {
        const { request } = useApi()
        const res = await request<MeResponse>("/api/auth/me/", { method: "GET" })

        this.user = res.user
        this.iupAccess = res.iup_access

        // update flags
        this.meLoaded = Array.isArray(this.user?.permissions)
        this.iupLoaded = !!this.iupAccess

        this.saveToStorage()
        return res
      })()

      try {
        return await this.mePromise
      } finally {
        this.mePromise = null
      }
    },

    async refreshToken() {
      if (!this.refresh) throw new Error("No refresh token")

      const config = useRuntimeConfig()
      const baseURL = config.public.apiBaseUrl

      const res = await $fetch<{ access: string }>(`${baseURL}/api/auth/refresh/`, {
        method: "POST",
        body: { refresh: this.refresh },
      })

      this.access = res.access
      this.saveToStorage()
      return this.access
    },
  },
})