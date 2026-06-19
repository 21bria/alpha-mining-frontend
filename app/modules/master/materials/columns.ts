import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader.vue'
import DataTableRowActions from './components/DataTableRowActions.vue'

export type MaterialRow = {
  id: number
  name: string
  sale_adjust: string
  is_ore: boolean
  is_production: boolean
  description: string | null
}

type ColumnActions = {
  onEdit: (row: MaterialRow) => void
  onDelete: (row: MaterialRow) => void
}
type CheckState = boolean | "indeterminate"
export function getMaterialColumns(actions: ColumnActions): ColumnDef<MaterialRow>[] {
  return [
    {
      id: "select",
      header: ({ table }) =>
        h(Checkbox, {
          modelValue: table.getIsAllPageRowsSelected(),
          "onUpdate:modelValue": (v: CheckState) =>
            table.toggleAllPageRowsSelected(v === true),
          indeterminate: table.getIsSomePageRowsSelected(),
          onClick: (e: MouseEvent) => e.stopPropagation(),
          "aria-label": "Select all",
        }),

      cell: ({ row }) =>
        h(Checkbox, {
          modelValue: row.getIsSelected(),
          "onUpdate:modelValue": (v: CheckState) =>
            row.toggleSelected(v === true),
          onClick: (e: MouseEvent) => e.stopPropagation(),
          "aria-label": "Select row",
        }),

      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Name' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.name),
    },
    {
      accessorKey: 'is_ore',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Ore' }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          'span',
          {
            class: row.original.is_ore
              ? 'rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600'
              : 'rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground',
          },
          row.original.is_ore ? 'Yes' : 'No'
        ),
    },
    {
      accessorKey: 'is_production',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Production' }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          'span',
          {
            class: row.original.is_production
              ? 'rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600'
              : 'rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground',
          },
          row.original.is_production ? 'Yes' : 'No'
        ),
    },
    {
      accessorKey: 'sale_adjust',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Sale' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'text-muted-foreground' }, row.original.sale_adjust ?? '-'),
    },
    {
      accessorKey: 'description',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Description' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'text-muted-foreground' }, row.original.description ?? '-'),
    },
    {
      id: 'actions',
      header: () => h('div', { class: 'text-right' }, 'Actions'),
      cell: ({ row }) =>
        h('div', { class: 'flex justify-end' }, [
          h(DataTableRowActions, {
            row: row.original,
            onEdit: actions.onEdit,
            onDelete: actions.onDelete,
          }),
        ]),
    }
  ]
}
