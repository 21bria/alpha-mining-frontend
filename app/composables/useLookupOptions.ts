// ~/composables/useLookupOptions.ts
import { ref, computed, unref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useApi } from '@/composables/useApi'

export type LookupOption = { value: number; label: string }
export type LookupListResponse = { count: number; next: string | null; results: LookupOption[] }

type MaybeRef<T> = T | { value: T }

type UseLookupOptionsParams = {
  endpoint: string
  pageSize?: number
  depends?: MaybeRef<Record<string, any> | null | undefined>
  /**
   * Optional: jika edit cuma punya ID, kamu bisa kasih:
   * - getDetailEndpoint: (id) => `/api/.../${id}/`
   * - mapDetailToOption: (detail) => ({ value: detail.id, label: detail.name })
   */
  getDetailEndpoint?: (id: number) => string
  mapDetailToOption?: (detail: any) => LookupOption
}

export function useLookupOptions(params: UseLookupOptionsParams) {
  const { request } = useApi()

  const endpoint = params.endpoint
  const pageSize = params.pageSize ?? 10

  const options = ref<LookupOption[]>([])
  const loading = ref(false)

  const search = ref('')
  const page = ref(1)
  const hasMore = ref(true)

  // depends biasanya object (division=..., department=...)
  const dependsObj = computed(() => unref(params.depends) ?? null)

  function buildQuery(q: string, pageNo: number) {
    const depends = dependsObj.value ?? {}
    // buang null/undefined biar query bersih
    const cleanDepends: Record<string, any> = {}
    Object.keys(depends).forEach((k) => {
      const v = (depends as any)[k]
      if (v !== null && v !== undefined && v !== '') cleanDepends[k] = v
    })

    return {
      search: q || '',
      page: pageNo,
      page_size: pageSize,
      ...cleanDepends,
    }
  }

  async function fetchPage(q = '', pageNo = 1) {
    if (loading.value) return
    loading.value = true
    try {
      const res: any = await request(endpoint, {
        method: 'GET',
        query: buildQuery(q, pageNo),
      })

      const items = (res?.results ?? []) as LookupOption[]
      const count = Number(res?.count ?? 0)

      if (pageNo === 1) options.value = items
      else options.value = [...options.value, ...items]

      page.value = pageNo
      hasMore.value = options.value.length < count
    } finally {
      loading.value = false
    }
  }

  // reset & fetch page 1 (dipakai saat open dialog / depends berubah)
  async function refresh() {
    page.value = 1
    hasMore.value = true
    await fetchPage(search.value, 1)
  }

  // debounce search
  const onSearch = useDebounceFn(async (q: string) => {
    search.value = q
    await refresh()
  }, 300)

  // infinite scroll handler
  async function onScroll(e: Event) {
    const el = e.target as HTMLElement
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
    if (!nearBottom) return
    if (!hasMore.value || loading.value) return
    await fetchPage(search.value, page.value + 1)
  }

  /**
   * Pastikan option untuk value terpilih ada di list,
   * kalau belum ada: inject dari initial label atau fetch detail (optional).
   */
  async function ensureSelected(
    selectedId: number | null | undefined,
    initialLabel?: string
  ) {
    if (!selectedId) return

    const exists = options.value.some((x) => Number(x.value) === Number(selectedId))
    if (exists) return

    // 1) kalau ada initialLabel (misal serializer kasih department_name)
    if (initialLabel) {
      options.value = [{ value: Number(selectedId), label: initialLabel }, ...options.value]
      return
    }

    // 2) kalau ada endpoint detail, fetch detail buat bikin label
    if (params.getDetailEndpoint && params.mapDetailToOption) {
      try {
        const detail: any = await request(params.getDetailEndpoint(Number(selectedId)), { method: 'GET' })
        const opt = params.mapDetailToOption(detail)
        options.value = [opt, ...options.value]
      } catch {
        // fallback: tetap inject minimal biar tampil
        options.value = [{ value: Number(selectedId), label: `#${selectedId}` }, ...options.value]
      }
      return
    }

    // 3) fallback: inject minimal
    options.value = [{ value: Number(selectedId), label: `#${selectedId}` }, ...options.value]
  }

  /**
   * Kalau depends berubah (misal division berubah), options harus reload.
   * Biasanya ini dipanggil oleh component yang punya flag hydrating,
   * tapi composable juga bisa auto-refresh saat depends berubah.
   */
  watch(
    dependsObj,
    () => {
      // saat depends berubah, reset search/page
      search.value = ''
      refresh()
    },
    { deep: true }
  )

  return {
    options,
    loading,
    search,
    page,
    hasMore,
    fetchPage,
    refresh,
    onSearch,
    onScroll,
    ensureSelected,
  }
}