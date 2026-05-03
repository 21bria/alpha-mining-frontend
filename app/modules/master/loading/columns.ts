import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"

export type SourceMineLoadingRow = {
  id: number
  iup: number | null
  iup_code: string | null
  iup_name: string | null

  loading_point: string
  category: string | null

  // FK ke SourceMines
  source: number | null
  source_label?: string | null // readonly dari API (recommended)

  description: string | null
  status: number | null
  latitude: number | null
  longitude: number | null
  geometry: unknown | null
  extra_properties: Record<string, any> | null
  user?: number | null
}

type ColumnActions = {
  onEdit: (row: SourceMineLoadingRow) => void
  onDelete: (row: SourceMineLoadingRow) => void
}

type CheckState = boolean | "indeterminate"
export type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
  showSource?: boolean
  showCategory?: boolean
}

function fmtStatus(v: number | null | undefined) {
  if (v === null || v === undefined) return "-"
  if (v === 1) return "Active"
  if (v === 0) return "Inactive"
  return String(v)
}

export function getSourceMineLoadingColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<SourceMineLoadingRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? role !== "SITE_USER"
  const canMutate = role !== "GLOBAL_VIEWER"

  const showSource = opts.showSource ?? true
  const showCategory = opts.showCategory ?? true

  const cols: ColumnDef<SourceMineLoadingRow>[] = [
    {
      id: "select",
      header: ({ table }) =>
        h(Checkbox, {
          modelValue: table.getIsAllPageRowsSelected(),
          "onUpdate:modelValue": (v: CheckState) => table.toggleAllPageRowsSelected(v === true),
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

    // ✅ loading_point (utama)
    {
      accessorKey: "loading_point",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Loading Point" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.loading_point ?? "-"),
    },

    // ✅ source (pit/source area)
    ...(showSource
      ? [
        {
          accessorKey: "source_label",
          header: ({ column }: any) => h(DataTableColumnHeader, { column, title: "Source" }),
          enableSorting: false,
          cell: ({ row }: any) =>
            h(
              "div",
              { class: "text-muted-foreground" },
              row.original.source_label ?? (row.original.source != null ? `#${row.original.source}` : "-")
            ),
        } as ColumnDef<SourceMineLoadingRow>,
      ]
      : []),

    {
      accessorKey: "latitude",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Latitude" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "text-muted-foreground" }, row.original.latitude ?? "-"),
    },
    {
      accessorKey: "longitude",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Longitude" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "text-muted-foreground" }, row.original.longitude ?? "-"),
    },

    ...(showIup
      ? [
        {
          accessorKey: "iup_code",
          header: ({ column }: any) => h(DataTableColumnHeader, { column, title: "IUP Code" }),
          enableSorting: true,
          cell: ({ row }: any) =>
            h("div", { class: "text-muted-foreground" }, row.original.iup_code ?? "-"),
        } as ColumnDef<SourceMineLoadingRow>,
      ]
      : []),

    {
      accessorKey: "status",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Status" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "text-muted-foreground" }, fmtStatus(row.original.status)),
    },
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
        } as ColumnDef<SourceMineLoadingRow>,
      ]
      : []),
  ]

  return cols
}