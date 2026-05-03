import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader.vue'
import DataTableRowActions from './components/DataTableRowActions.vue'

export type SurveyorRow = {
  id: number
  code_surveyor: string
  name_surveyor: string
  description: string | null
  status: number | null
  user?: number | null
}

function fmtStatus(v: number | null | undefined) {
  if (v === null || v === undefined) return "-"
  if (v === 1) return "Active"
  if (v === 0) return "Inactive"
  return String(v)
}

type ColumnActions = {
  onEdit: (row: SurveyorRow) => void
  onDelete: (row: SurveyorRow) => void
}
type CheckState = boolean | "indeterminate"
export function getSurveyorColumns(actions: ColumnActions): ColumnDef<SurveyorRow>[] {
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
      accessorKey: 'code_surveyor',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Code' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.code_surveyor),
    },
    {
      accessorKey: 'name_surveyor',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Name' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.name_surveyor),
    },
    {
      accessorKey: 'description',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Description' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'text-muted-foreground' }, row.original.description ?? '-'),
    },
    {
      accessorKey: "status",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Status" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, fmtStatus(row.original.status)),
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
