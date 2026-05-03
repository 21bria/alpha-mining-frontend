import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader.vue'
import DataTableRowActions from './components/DataTableRowActions.vue'

export type SourceMineRow = {
  id: number
  iup: number | null
  iup_code: string | null
  iup_name: string | null
  sources_area: string
  description: string | null
  status: number | null
  latitude: number | null
  longitude: number | null
  geometry: unknown | null
  extra_properties: Record<string, any> | null
}

type ColumnActions = {
  onEdit: (row: SourceMineRow) => void
  onDelete: (row: SourceMineRow) => void
}
type CheckState = boolean | "indeterminate"
export type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

export function getSourceMineColumns(actions: ColumnActions, opts: ColumnOptions = {}): ColumnDef<SourceMineRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<SourceMineRow>[] = [
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
          disabled: !canMutate,
        }),
      cell: ({ row }) =>
        h(Checkbox, {
          modelValue: row.getIsSelected(),
          "onUpdate:modelValue": (v: CheckState) => row.toggleSelected(v === true),
          onClick: (e: MouseEvent) => e.stopPropagation(),
          "aria-label": "Select row",
          disabled: !canMutate,
        }),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    {
      accessorKey: 'sources_area',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Name' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.sources_area),
    },
    {
      accessorKey: 'latitude',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Latitude' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'text-muted-foreground' }, row.original.latitude ?? '-'),
    },
    {
      accessorKey: 'longitude',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Longitude' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'text-muted-foreground' }, row.original.longitude ?? '-'),
    },
    ...(showIup
      ? [
        {
          accessorKey: "iup_code",
          header: ({ column }: any) =>
            h(DataTableColumnHeader, { column, title: "IUP Code" }),
          enableSorting: true,
          cell: ({ row }: any) =>
            h("div", { class: "text-muted-foreground" }, row.original.iup_code ?? "-"),
        } as ColumnDef<SourceMineRow>,
      ]
      : []),

    {
      accessorKey: "description",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Description" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground line-clamp-2" }, row.original.description ?? "-"),
    },

    ...(canMutate
      ? [
        {
          id: "actions",
          header: () => h("div", { class: "text-right" }, "Actions"),
          cell: ({ row }: any) =>
            h("div", { class: "flex justify-end" }, [
              h(DataTableRowActions, {
                row: row.original,
                onEdit: actions.onEdit,
                onDelete: actions.onDelete,
              }),
            ]),
        } as ColumnDef<SourceMineRow>,
      ]
      : []),
  ]

  return cols
}