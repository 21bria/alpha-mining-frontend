<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useApi } from "@/composables/useApi"

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select"

const { request } = useApi()

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

export type UserPayload = {
  id?: number
  username: string
  email: string
  first_name?: string | null
  last_name?: string | null
  is_active?: boolean
  role: string
  default_iup_id?: number | null
  allowed_iup_ids?: number[]
  groups?: number[]
  password?: string
}

type UserFormState = {
  id?: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  role: string
  default_iup_id: number | null
  allowed_iup_ids: number[]
  groups: number[]
  password: string
}

const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  role: string
  initial?: Partial<UserPayload> | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: UserPayload): void
}>()

/** ========= Role normalize ========= */
function normalizeRole(v: any): UserRole {
  const raw = String(v ?? "").trim().toUpperCase()
  if (["SYSTEM", "MANAGEMENT", "GLOBAL_VIEWER", "SITE_USER"].includes(raw)) return raw as UserRole
  if (raw === "SUPER_ADMIN" || raw === "SUPERADMIN" || raw === "ADMIN") return "SYSTEM"
  return "SITE_USER"
}

const currentRole = computed<UserRole>(() => normalizeRole(props.role))
const canMutate = computed(() => currentRole.value !== "GLOBAL_VIEWER")
const canAdminUser = computed(() => currentRole.value === "SYSTEM" || currentRole.value === "MANAGEMENT")

/** ========= Form state ========= */
const local = ref<UserFormState>({
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  is_active: true,
  role: "SITE_USER",
  default_iup_id: null,
  allowed_iup_ids: [],
  groups: [],
  password: "",
})

const isTargetSystem = computed(() => local.value.role === "SYSTEM")
const showGroupsSection = computed(() => canAdminUser.value && !isTargetSystem.value)
const showIupSection = computed(
  () => canAdminUser.value && !isTargetSystem.value && ["SITE_USER", "MANAGEMENT"].includes(local.value.role)
)

const title = computed(() => (props.mode === "create" ? "Add User" : "Edit User"))
const close = () => emit("update:open", false)

/** ========= Helpers ========= */
function normalizeId(v: any): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** ✅ robust: terima [2,3] atau [{id:2,name:".."}] lalu hasilkan number[] bersih */
function normalizeGroupIds(input: any): number[] {
  const arr = Array.isArray(input) ? input : []
  return arr
    .map((g) => Number((g && typeof g === "object") ? (g.id ?? g.value ?? g.pk) : g))
    .filter((n) => Number.isFinite(n))
}

const formErrors = ref<Record<string, string[]> | null>(null)
const fieldError = (key: string) => {
  const e = formErrors.value?.[key] ?? props.errors?.[key]
  if (!e) return null
  return Array.isArray(e) ? e[0] : String(e)
}

/** ========= Lookup endpoints ========= */
const IUP_LOOKUP_URL = computed(() => "/api/master/lookups/mine-iup/")
const GROUP_LOOKUP_URL = "/api/auth/groups/lookup"

/** ========= IUP lookup ========= */
const iupOptions = ref<Array<{ value: number; label: string }>>([])
const iupLoading = ref(false)
const iupSearch = ref("")
const iupPage = ref(1)
const iupHasMore = ref(true)
const iupContentRef = ref<HTMLElement | null>(null)

async function fetchIUP(q = "", page = 1) {
  if (iupLoading.value) return
  iupLoading.value = true
  try {
    const res: any = await request(IUP_LOOKUP_URL.value, {
      method: "GET",
      query: { search: q, page, page_size: 10 },
    })

    const items = (Array.isArray(res) ? res : (res?.results ?? [])) as Array<{ value: number; label: string }>
    const count = Array.isArray(res) ? items.length : Number(res?.count ?? 0)

    if (page === 1) iupOptions.value = items
    else iupOptions.value = [...iupOptions.value, ...items]

    iupPage.value = page
    iupHasMore.value = count ? iupOptions.value.length < count : false
  } finally {
    iupLoading.value = false
  }
}

const onIUPSearch = useDebounceFn((q: string) => {
  iupSearch.value = q
  iupPage.value = 1
  iupHasMore.value = true
  fetchIUP(q, 1).then(() => {
    if (iupContentRef.value) iupContentRef.value.scrollTop = 0
  })
}, 300)

function onIUPScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && iupHasMore.value && !iupLoading.value) {
    fetchIUP(iupSearch.value, iupPage.value + 1)
  }
}

const selectedIUPLabel = (id: number | null) => {
  if (id == null) return null
  return iupOptions.value.find((x) => Number(x.value) === Number(id))?.label ?? null
}

/** ========= Groups lookup ========= */
const groupOptions = ref<Array<{ value: number; label: string }>>([])
const groupLoading = ref(false)
const groupSearch = ref("")
const groupPage = ref(1)
const groupHasMore = ref(true)
const groupContentRef = ref<HTMLElement | null>(null)

async function fetchGroups(q = "", page = 1) {
  if (groupLoading.value) return
  groupLoading.value = true
  try {
    const res: any = await request(GROUP_LOOKUP_URL, {
      method: "GET",
      query: { search: q, page, page_size: 10 },
    })

    const raw = Array.isArray(res) ? res : (res?.results ?? [])
    const mapped = raw
      .map((g: any) => ({
        value: Number(g.value ?? g.id ?? g.pk),
        label: String(g.label ?? g.name ?? g.title ?? g.value ?? g.id ?? g.pk),
      }))
      .filter((x: any) => Number.isFinite(x.value))

    const count = Array.isArray(res) ? mapped.length : Number(res?.count ?? 0)

    if (page === 1) groupOptions.value = mapped
    else groupOptions.value = [...groupOptions.value, ...mapped]

    groupPage.value = page
    groupHasMore.value = count ? groupOptions.value.length < count : false
  } finally {
    groupLoading.value = false
  }
}

const onGroupSearch = useDebounceFn((q: string) => {
  groupSearch.value = q
  groupPage.value = 1
  groupHasMore.value = true
  fetchGroups(q, 1).then(() => {
    if (groupContentRef.value) groupContentRef.value.scrollTop = 0
  })
}, 300)

function onGroupScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && groupHasMore.value && !groupLoading.value) {
    fetchGroups(groupSearch.value, groupPage.value + 1)
  }
}

/** ========= Multi select ========= */
function toggleGroup(v: number) {
  const set = new Set(local.value.groups)
  if (set.has(v)) set.delete(v)
  else set.add(v)
  local.value.groups = Array.from(set)
}

function toggleAllowedIup(id: number) {
  const set = new Set(local.value.allowed_iup_ids)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  local.value.allowed_iup_ids = Array.from(set)

  if (local.value.default_iup_id == null && local.value.allowed_iup_ids.length > 0) {
    local.value.default_iup_id = local.value.allowed_iup_ids[0]
  }
}

/** ========= Submit ========= */
const submit = () => {
  formErrors.value = {}

  if (!local.value.username.trim()) formErrors.value.username = ["Username is required"]
  if (!local.value.email.trim()) formErrors.value.email = ["Email is required"]
  if (!local.value.role) formErrors.value.role = ["Role is required"]

  if (showGroupsSection.value && local.value.groups.length === 0) {
    formErrors.value.groups = ["At least one group is required"]
  }

  if (showIupSection.value && !local.value.default_iup_id) {
    formErrors.value.default_iup_id = ["Default IUP is required"]
  }

  if (Object.keys(formErrors.value).length > 0) return

  const targetIsSystem = local.value.role === "SYSTEM"

  const payload: UserPayload = {
    id: local.value.id,
    username: local.value.username.trim(),
    email: local.value.email.trim(),
    first_name: local.value.first_name.trim(),
    last_name: local.value.last_name.trim(),
    is_active: local.value.is_active,
    role: local.value.role,

    /** ✅ safety: jangan pernah kirim NaN */
    groups: targetIsSystem ? [] : local.value.groups.filter((n) => Number.isFinite(n)),

    default_iup_id: targetIsSystem ? undefined : (showIupSection.value ? local.value.default_iup_id : undefined),
    allowed_iup_ids: targetIsSystem ? undefined : (showIupSection.value ? local.value.allowed_iup_ids : undefined),
  }

  if (local.value.password.trim()) payload.password = local.value.password.trim()
  emit("submit", payload)
}

/** ========= Init ========= */
async function initForm() {
  const init = props.initial ?? {}

  local.value = {
    id: init.id,
    username: String(init.username ?? ""),
    email: String(init.email ?? ""),
    first_name: String(init.first_name ?? ""),
    last_name: String(init.last_name ?? ""),
    is_active: Boolean(init.is_active ?? true),
    role: String(init.role ?? "SITE_USER"),
    default_iup_id: normalizeId((init as any).default_iup_id),
    allowed_iup_ids: Array.isArray((init as any).allowed_iup_ids) ? (init as any).allowed_iup_ids : [],
    /** ✅ robust! */
    groups: normalizeGroupIds((init as any).groups),
    password: "",
  }
}

async function preloadLookups() {
  if (showIupSection.value) {
    iupSearch.value = ""
    iupPage.value = 1
    iupHasMore.value = true
    await fetchIUP("", 1)
  }
  if (showGroupsSection.value) {
    groupSearch.value = ""
    groupPage.value = 1
    groupHasMore.value = true
    await fetchGroups("", 1)
  }
}

watch(
  () => [props.open, currentRole.value] as const,
  async ([open]) => {
    if (!open) return
    await initForm()
    await preloadLookups()
  },
  { immediate: true }
)

/** label helper untuk Selected */
const selectedGroupLabels = computed(() => {
  const map = new Map(groupOptions.value.map((g) => [g.value, g.label]))
  return local.value.groups.map((id) => map.get(id) ?? String(id)).join(", ")
})
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle class="flex items-center justify-between gap-3">
          <span>{{ title }}</span>
          <span class="text-xs text-muted-foreground">role: {{ props.role }} → {{ currentRole }}</span>
        </DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <div class="grid gap-2">
          <label class="text-sm font-medium">Username</label>
          <Input v-model="local.username" :disabled="!canMutate" />
          <p v-if="fieldError('username')" class="text-sm text-destructive">{{ fieldError("username") }}</p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Email</label>
          <Input v-model="local.email" type="email" :disabled="!canMutate" />
          <p v-if="fieldError('email')" class="text-sm text-destructive">{{ fieldError("email") }}</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="grid gap-2">
            <label class="text-sm font-medium">First name</label>
            <Input v-model="local.first_name" :disabled="!canMutate" />
            <p v-if="fieldError('first_name')" class="text-sm text-destructive">
              {{ fieldError("first_name") }}
            </p>
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium">Last name</label>
            <Input v-model="local.last_name" :disabled="!canMutate" />
            <p v-if="fieldError('last_name')" class="text-sm text-destructive">
              {{ fieldError("last_name") }}
            </p>
          </div>
        </div>

        <!-- ROLE -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Role</label>
          <Select :model-value="local.role" @update:model-value="(v) => (local.role = v)" :disabled="!canAdminUser">
            <SelectTrigger class="h-9">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="SYSTEM">SYSTEM</SelectItem>
                <SelectItem value="MANAGEMENT">MANAGEMENT</SelectItem>
                <SelectItem value="SITE_USER">SITE_USER</SelectItem>
                <SelectItem value="GLOBAL_VIEWER">GLOBAL_VIEWER</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <!-- GROUPS -->
        <div v-if="showGroupsSection" class="grid gap-2">
          <label class="text-sm font-medium">Groups</label>

          <Select :model-value="''" :disabled="groupLoading || !canMutate">
            <SelectTrigger class="h-9">
              <SelectValue :placeholder="groupLoading ? 'Loading...' : 'Add / remove groups'" />
            </SelectTrigger>

            <SelectContent ref="groupContentRef" class="max-h-80 overflow-auto" @scroll="onGroupScroll">
              <SelectGroup>
                <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                  <Input v-model="groupSearch" placeholder="Search group..." class="h-8"
                    @input="onGroupSearch(groupSearch)" @keydown.stop @click.stop />
                </div>

                <div class="p-2 space-y-2">
                  <div v-for="g in groupOptions" :key="g.value" class="flex items-center gap-2" @mousedown.stop
                    @click.stop>
                    <Checkbox :model-value="local.groups.includes(g.value)"
                      @update:model-value="() => toggleGroup(g.value)" :disabled="!canMutate" />
                    <span class="text-sm">{{ g.label }}</span>
                  </div>

                  <div v-if="groupLoading" class="text-sm text-muted-foreground">Loading...</div>
                  <div v-if="!groupLoading && groupOptions.length === 0" class="text-sm text-muted-foreground">
                    No results
                  </div>
                </div>
              </SelectGroup>
            </SelectContent>
          </Select>

          <p v-if="local.groups.length" class="text-xs text-muted-foreground">
            Selected: <span class="font-medium">{{ selectedGroupLabels }}</span>
          </p>
        </div>

        <!-- IUP -->
        <div v-if="showIupSection" class="grid gap-2">
          <label class="text-sm font-medium">Default IUP</label>

          <Select :model-value="local.default_iup_id != null ? String(local.default_iup_id) : ''"
            @update:model-value="(v) => (local.default_iup_id = v ? Number(v) : null)"
            :disabled="iupLoading || !canMutate">
            <SelectTrigger class="h-9">
              <SelectValue :placeholder="iupLoading ? 'Loading...' : 'Select default IUP'" />
            </SelectTrigger>

            <SelectContent ref="iupContentRef" class="max-h-80 overflow-auto" @scroll="onIUPScroll">
              <SelectGroup>
                <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                  <Input v-model="iupSearch" placeholder="Search IUP..." class="h-8" @input="onIUPSearch(iupSearch)"
                    @keydown.stop @click.stop />
                </div>

                <div v-if="local.default_iup_id != null && selectedIUPLabel(local.default_iup_id)"
                  class="sticky top-[46px] z-10 bg-background/30 backdrop-blur px-2 py-1 border-b text-xs">
                  Selected: <span class="font-medium">{{ selectedIUPLabel(local.default_iup_id) }}</span>
                </div>

                <SelectItem v-for="o in iupOptions" :key="String(o.value)" :value="String(o.value)">
                  {{ o.label }}
                </SelectItem>

                <div v-if="iupLoading" class="p-2 text-sm text-muted-foreground">Loading...</div>
                <div v-if="!iupLoading && iupOptions.length === 0" class="p-2 text-sm text-muted-foreground">
                  No results
                </div>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p v-if="fieldError('default_iup_id')" class="text-sm text-destructive">
            {{ fieldError('default_iup_id') }}
          </p>
        </div>

        <div v-if="showIupSection" class="grid gap-2">
          <label class="text-sm font-medium">Allowed IUPs</label>
          <div class="rounded-md border p-2 max-h-56 overflow-auto space-y-2">
            <div v-for="o in iupOptions" :key="`allowed-${o.value}`" class="flex items-center gap-2">
              <Checkbox :model-value="local.allowed_iup_ids.includes(o.value)"
                @update:model-value="() => toggleAllowedIup(o.value)" :disabled="!canMutate" />
              <span class="text-sm">{{ o.label }}</span>
            </div>
          </div>
          <p v-if="fieldError('allowed_iup_ids')" class="text-sm text-destructive">
            {{ fieldError('allowed_iup_ids') }}
          </p>
        </div>

        <!-- ACTIVE -->
        <label class="flex items-center gap-2 text-sm">
          <Checkbox :model-value="local.is_active" @update:model-value="(v) => (local.is_active = v === true)"
            :disabled="!canMutate" />
          Active
        </label>

        <p v-if="fieldError('detail')" class="text-sm text-destructive">
          {{ fieldError("detail") }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">Cancel</Button>
        <Button v-if="canMutate" :disabled="props.loading || !local.username.trim() || !local.email.trim()"
          @click="submit">
          {{ props.loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>