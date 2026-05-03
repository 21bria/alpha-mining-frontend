<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type GroupPayload = {
  id?: number
  name: string
}

type GroupFormState = {
  id?: number
  name: string
}

const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  initial?: GroupPayload | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: GroupPayload): void
}>()

const local = ref<GroupFormState>({
  name: "",
})

const title = computed(() => (props.mode === "create" ? "Add Group" : "Edit Group"))
const close = () => emit("update:open", false)

const fieldError = (key: string) => {
  const e = props.errors?.[key]
  if (!e) return null
  return Array.isArray(e) ? e[0] : String(e)
}

const submit = () => {
  emit("submit", {
    id: local.value.id,
    name: local.value.name.trim(),
  })
}

watch(
  () => props.open,
  (v) => {
    if (!v) return
    local.value = {
      id: props.initial?.id,
      name: props.initial?.name ?? "",
    }
  },
  { immediate: true }
)
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <div class="grid gap-2">
          <label class="text-sm font-medium">Group Name</label>
          <Input v-model="local.name" placeholder="e.g. MINING_ADMIN" :disabled="loading" />
          <p v-if="fieldError('name')" class="text-sm text-destructive">
            {{ fieldError("name") }}
          </p>
        </div>

        <p v-if="fieldError('detail')" class="text-sm text-destructive">
          {{ fieldError("detail") }}
        </p>
        <p v-if="fieldError('non_field_errors')" class="text-sm text-destructive">
          {{ fieldError("non_field_errors") }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">Cancel</Button>
        <Button :disabled="loading || !local.name.trim()" @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>