<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import type { TreeItem } from "@nuxt/ui"
import { useApi } from "@/composables/useApi"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select"

const { request } = useApi()

/** ===================== Types ===================== */
type PermItem = { id: number; code: string; name: string; codename: string }
type PermModel = { model: string; perms: PermItem[] }
type PermApp = { app: string; models: PermModel[] }

type PermNodeType = "app" | "model" | "perm"
type PermNode = TreeItem & {
  _type: PermNodeType
  _ids?: number[]
  _permId?: number
  _permCode?: string
  _permName?: string
  _level?: number
}

type GroupOption = { value: string; label: string }

/** ===================== State ===================== */
const loading = ref(false)
const apiError = ref<string | null>(null)
const search = ref("")

const selectedIds = ref<number[]>([])
const permApps = ref<PermApp[]>([])

const selectedCount = computed(() => selectedIds.value.length)

/** ===================== Helpers ===================== */
function titleize(s: string) {
  return s
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function isChecked(id: number) {
  return selectedIds.value.includes(id)
}
function toggleId(id: number) {
  const set = new Set(selectedIds.value)
  set.has(id) ? set.delete(id) : set.add(id)
  selectedIds.value = Array.from(set)
}
function selectAll(ids: number[]) {
  const set = new Set(selectedIds.value)
  ids.forEach((id) => set.add(id))
  selectedIds.value = Array.from(set)
}
function clearAll(ids: number[]) {
  const set = new Set(selectedIds.value)
  ids.forEach((id) => set.delete(id))
  selectedIds.value = Array.from(set)
}
function nodeState(ids: number[] | undefined) {
  const arr = ids ?? []
  if (!arr.length) return { checked: false, indeterminate: false }

  let hit = 0
  for (const id of arr) if (isChecked(id)) hit++

  if (hit === 0) return { checked: false, indeterminate: false }
  if (hit === arr.length) return { checked: true, indeterminate: false }
  return { checked: false, indeterminate: true }
}

/** add _level recursively */
function withLevel(nodes: PermNode[], level = 0): PermNode[] {
  return nodes.map((n) => ({
    ...n,
    _level: level,
    children: n.children ? withLevel(n.children as PermNode[], level + 1) : undefined,
  }))
}

/** expand app/model when searching */
function withDefaultExpandedOnSearch(nodes: PermNode[], q: string): PermNode[] {
  if (!q) return nodes
  return nodes.map((n) => ({
    ...n,
    defaultExpanded: n._type !== "perm",
    children: n.children ? withDefaultExpandedOnSearch(n.children as PermNode[], q) : undefined,
  }))
}

/** ===================== Permission Tree (GET) ===================== */
async function loadPermissionTree() {
  loading.value = true
  apiError.value = null
  try {
    const res = await request<PermApp[]>("/api/auth/permissions/tree/", { method: "GET" })
    permApps.value = res ?? []
  } catch (e: any) {
    apiError.value = e?.data?.detail ?? e?.message ?? "Failed to load permissions"
  } finally {
    loading.value = false
  }
}

const items = computed<PermNode[]>(() => {
  const q = search.value.trim().toLowerCase()

  const appNodes: PermNode[] = permApps.value
    .map((app) => {
      const modelNodes: PermNode[] = app.models
        .map((m) => {
          const filteredPerms = m.perms.filter((p) => {
            if (!q) return true
            return (
              p.code.toLowerCase().includes(q) ||
              p.name.toLowerCase().includes(q) ||
              p.codename.toLowerCase().includes(q)
            )
          })

          const permNodes: PermNode[] = filteredPerms.map((p) => ({
            label: p.code,
            _type: "perm",
            _permId: p.id,
            _permCode: p.code,
            _permName: p.name,
          }))

          if (q && permNodes.length === 0) return null as any

          return {
            label: titleize(m.model),
            children: permNodes,
            _type: "model",
            _ids: m.perms.map((p) => p.id),
          } as PermNode
        })
        .filter(Boolean) as PermNode[]

      if (q && modelNodes.length === 0) return null as any

      const allIds = app.models.flatMap((m) => m.perms.map((p) => p.id))

      return {
        label: titleize(app.app),
        children: modelNodes,
        _type: "app",
        _ids: allIds,
      } as PermNode
    })
    .filter(Boolean) as PermNode[]

  const expanded = withDefaultExpandedOnSearch(appNodes, q)
  return withLevel(expanded, 0)
})

/** ===================== Group Lookup (Select) ===================== */
const GROUP_LOOKUP_URL = "/api/auth/groups/lookup"

const groupOptions = ref<GroupOption[]>([])
const groupLoading = ref(false)
const groupSearch = ref("")
const groupPage = ref(1)
const groupHasMore = ref(true)

async function fetchGroups(q = "", page = 1) {
  if (groupLoading.value) return
  groupLoading.value = true
  try {
    const res: any = await request(GROUP_LOOKUP_URL, {
      method: "GET",
      query: { search: q, page, page_size: 10 },
    })

    const raw = (Array.isArray(res) ? res : (res?.results ?? [])) as any[]
    const count = Array.isArray(res) ? raw.length : Number(res?.count ?? 0)

    // IMPORTANT: pastikan value = ID group
    const mapped: GroupOption[] = raw.map((x) => ({
      value: String(x.id ?? x.pk ?? x.value),
      label: String(x.name ?? x.label ?? x.title ?? x.value ?? x.id ?? x.pk),
    }))

    groupOptions.value = page === 1 ? mapped : [...groupOptions.value, ...mapped]
    groupPage.value = page
    groupHasMore.value = count ? groupOptions.value.length < count : false
  } finally {
    groupLoading.value = false
  }
}

function onGroupSearchInput(q: string) {
  groupSearch.value = q
  groupPage.value = 1
  groupHasMore.value = true
  fetchGroups(q, 1)
}

function onGroupScroll(e: Event) {
  const el = e.target as HTMLElement
  if (!el || groupLoading.value || !groupHasMore.value) return
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom) fetchGroups(groupSearch.value, groupPage.value + 1)
}

/** ===================== Group Permissions (GET/PUT) ===================== */
const activeGroupId = ref<string>("")
const saving = ref(false)
const saveError = ref<string | null>(null)
const saveOk = ref(false)

function onActiveGroupChange(v: unknown) {
  // SAFE: gak akan pernah overwrite ref
  activeGroupId.value = String(v ?? "")
  saveOk.value = false
  saveError.value = null

  if (!activeGroupId.value) return
  loadActiveGroupPermissions()
}

async function loadActiveGroupPermissions() {
  if (!activeGroupId.value) return
  saveOk.value = false
  saveError.value = null
  try {
    const url = `/api/auth/admin/groups/${activeGroupId.value}/permissions/`
    const res = await request<{ group: string; permissions: number[] }>(url, { method: "GET" })
    selectedIds.value = res?.permissions ?? []
  } catch (e: any) {
    saveError.value = e?.data?.detail ?? e?.message ?? "Failed to load group permissions"
  }
}

async function saveActiveGroupPermissions() {
  if (!activeGroupId.value) {
    saveError.value = "Pilih group dulu"
    return
  }

  saving.value = true
  saveOk.value = false
  saveError.value = null

  try {
    const url = `/api/auth/admin/groups/${activeGroupId.value}/permissions/`

    await request(url, {
      method: "PATCH",
      body: { permissions: selectedIds.value },
    })

    saveOk.value = true
  } catch (e: any) {
    saveError.value = e?.data?.detail ?? e?.message ?? "Failed to save permissions"
  } finally {
    saving.value = false
  }
}

/** ===================== Mount ===================== */
onMounted(() => {
  loadPermissionTree()
  fetchGroups("", 1)
})
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-lg font-semibold">Permissions</h3>
        <p class="text-sm text-muted-foreground">
          Select permissions (e.g. <span class="font-mono">accounts.view_user</span>) to control menu + actions.
        </p>
      </div>

      <div class="text-sm text-muted-foreground">
        Selected: <span class="font-medium">{{ selectedCount }}</span>
      </div>
    </div>

    <!-- GROUP SELECTOR -->
    <div class="grid gap-2">
      <label class="text-sm font-medium">Group</label>

      <div class="flex items-center gap-2">
        <Select :model-value="activeGroupId" :disabled="groupLoading" @update:model-value="onActiveGroupChange">
          <SelectTrigger class="h-9 w-[320px]">
            <SelectValue :placeholder="groupLoading ? 'Loading...' : 'Select group...'" />
          </SelectTrigger>

          <SelectContent class="max-h-80 overflow-auto" @scroll="onGroupScroll">
            <SelectGroup>
              <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                <Input
                  v-model="groupSearch"
                  placeholder="Search group..."
                  class="h-8"
                  @input="onGroupSearchInput(groupSearch)"
                  @keydown.stop
                  @click.stop
                />
              </div>

              <div class="p-2 space-y-1">
                <SelectItem v-for="g in groupOptions" :key="g.value" :value="g.value">
                  {{ g.label }}
                </SelectItem>

                <div v-if="groupLoading" class="text-sm text-muted-foreground px-2 py-2">Loading...</div>
                <div v-if="!groupLoading && groupOptions.length === 0" class="text-sm text-muted-foreground px-2 py-2">
                  No results
                </div>
              </div>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button :disabled="!activeGroupId || saving" @click="saveActiveGroupPermissions">
          {{ saving ? "Saving..." : "Save" }}
        </Button>
      </div>

      <p v-if="saveOk" class="text-xs text-emerald-600">Saved.</p>
      <p v-if="saveError" class="text-xs text-destructive">{{ saveError }}</p>
    </div>

    <!-- Search permission -->
    <div class="flex items-center gap-2">
      <Input v-model="search" placeholder="Search permission code / name..." class="max-w-md" />
      <Button variant="outline" :disabled="loading" @click="loadPermissionTree">
        {{ loading ? "Loading..." : "Reload" }}
      </Button>
    </div>

    <p v-if="apiError" class="text-sm text-destructive">{{ apiError }}</p>

    <!-- Tree panel -->
    <div class="rounded-2xl border bg-background p-4">
      <UTree :items="items" class="permission-tree">
        <template #item="{ item, toggle, isExpanded }">
          <div class="w-full" :style="{ paddingLeft: `${(item._level ?? 0) * 22}px` }">
            <div class="flex items-center justify-between gap-3 rounded-xl px-3 py-1.5 bg-muted/60 hover:bg-muted transition">
              <!-- Left -->
              <div class="flex items-center gap-2 min-w-0">
                <template v-if="item._type !== 'perm'">
                  <Checkbox
                    :model-value="nodeState(item._ids).checked"
                    :indeterminate="nodeState(item._ids).indeterminate"
                    @update:model-value="(v) => (v ? selectAll(item._ids || []) : clearAll(item._ids || []))"
                    @click.stop
                  />
                  <UIcon name="i-lucide-folder" class="h-5 w-5 text-emerald-600" />
                </template>

                <template v-else>
                  <Checkbox
                    :model-value="isChecked(item._permId!)"
                    @update:model-value="() => toggleId(item._permId!)"
                    @click.stop
                  />
                  <UIcon name="i-lucide-file" class="h-5 w-5 text-emerald-600" />
                </template>

                <div class="min-w-0">
                  <div v-if="item._type === 'perm'">
                    <div class="font-mono text-sm truncate">{{ item._permCode }}</div>
                    <div class="text-xs text-muted-foreground truncate">{{ item._permName }}</div>
                  </div>

                  <div v-else class="flex items-center gap-2 min-w-0">
                    <div class="text-sm font-semibold truncate">{{ item.label }}</div>
                    <span v-if="item._type === 'model'" class="text-xs text-muted-foreground">
                      ({{ item.children?.length ?? 0 }})
                    </span>
                  </div>
                </div>
              </div>

              <!-- Right -->
              <div class="flex items-center gap-2 shrink-0" @click.stop>
                <button
                  v-if="item.children?.length"
                  type="button"
                  class="rounded-lg p-1 hover:bg-background/70 transition"
                  @click.stop="toggle?.(item)"
                  aria-label="Toggle"
                >
                  <UIcon
                    name="i-heroicons-chevron-right-20-solid"
                    class="h-5 w-5 text-emerald-600 transition-transform"
                    :class="isExpanded ? 'rotate-90' : 'rotate-0'"
                  />
                </button>
              </div>
            </div>
          </div>
        </template>
      </UTree>
    </div>

    <!-- Debug -->
    <div class="rounded-2xl border p-4">
      <div class="text-sm font-medium mb-2">Selected Permission IDs</div>
      <div class="text-xs text-muted-foreground break-words">{{ selectedIds }}</div>
    </div>
  </div>
</template>

<style scoped>
.permission-tree :deep(ul) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 0;
  margin: 0;
}
.permission-tree :deep(li) {
  list-style: none;
  margin: 0;
}
</style>