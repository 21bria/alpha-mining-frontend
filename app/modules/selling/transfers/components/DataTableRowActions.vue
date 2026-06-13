<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

import { Button } from '@/components/ui/button'
import { Icon } from '#components'

const props = defineProps<{
  row: any
  onView?: (row: any) => void
  onUndo?: (row: any) => void
  canUndo?: boolean
}>()
</script>

<template>
  <div class="flex w-full justify-end">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 p-0">
          <Icon name="i-radix-icons-dots-horizontal" class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" class="w-[180px]">
        <DropdownMenuItem v-if="props.onView" @click="props.onView(props.row)">
          View
        </DropdownMenuItem>

        <DropdownMenuItem v-if="props.onUndo && props.canUndo" class="text-amber-600" @click="props.onUndo(props.row)">
          Undo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>