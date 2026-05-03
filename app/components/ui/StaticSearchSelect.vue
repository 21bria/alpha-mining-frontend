<script setup lang="ts">
import { computed, ref } from "vue"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Opt = { value: any; label: string }

const props = defineProps<{
    options: Opt[]
    placeholder?: string
    clearLabel?: string          // text tombol empty
    showClear?: boolean          // tampilkan empty item
    disabled?: boolean
}>()

const model = defineModel<any | null>({ default: null })

const open = ref(false)
const q = ref("")

const placeholder = computed(() => props.placeholder ?? "Select...")
const clearLabel = computed(() => props.clearLabel ?? "Empty / Clear")

const selectedLabel = computed(() => {
    if (model.value == null) return ""
    return props.options.find(o => o.value === model.value)?.label ?? String(model.value)
})

const filtered = computed(() => {
    const s = q.value.trim().toLowerCase()
    if (!s) return props.options
    return props.options.filter(o => String(o.label).toLowerCase().includes(s))
})

function toggle() {
    if (props.disabled) return
    open.value = !open.value
}

function pick(v: any | null) {
    model.value = v
    open.value = false
    q.value = ""
}
</script>

<template>
    <div class="relative w-full">
        <Button type="button" variant="outline" class="h-9 w-full justify-between" :disabled="disabled" @click="toggle">
            <span class="truncate text-left">
                <span v-if="model == null" class="text-muted-foreground">{{ placeholder }}</span>
                <span v-else>{{ selectedLabel }}</span>
            </span>
            <Icon name="i-radix-icons-chevron-down" class="h-4 w-4 opacity-70" />
        </Button>

        <div v-if="open" class="absolute z-50 mt-2 w-full rounded-md border bg-background shadow">
            <div class="p-2 border-b">
                <Input v-model="q" class="h-9" placeholder="Search..." />
            </div>

            <div class="max-h-[260px] overflow-auto">
                <!-- EMPTY / CLEAR -->
                <button v-if="props.showClear !== false" type="button"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-muted" @click="pick(null)">
                    {{ clearLabel }}
                </button>

                <button v-for="it in filtered" :key="String(it.value)" type="button"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-muted" @click="pick(it.value)">
                    {{ it.label }}
                </button>

                <div v-if="filtered.length === 0" class="px-3 py-2 text-xs text-muted-foreground">
                    No results
                </div>
            </div>
        </div>
    </div>
</template>