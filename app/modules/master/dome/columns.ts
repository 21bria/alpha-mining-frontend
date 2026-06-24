import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"

export type SourceMinesDomeRow = {
  id: number
  iup: number | null
  iup_code: string | null
  iup_name: string | null

  pile_id: string
  category: string | null
  plan_ni_min: number | null
  plan_ni_max: number | null
  direct_sale: string

  // FK ke Dumping Point (SourceMinesDumping)
  dumping: number | null
  dumping_label?: string | null // readonly dari API (recommended)

  description: string | null
  status: number | null
  latitude: number | null
  longitude: number | null
  geometry: unknown | null
  extra_properties: Record<string, any> | null
  user?: number | null
}

type ColumnActions = {
  onEdit: (row: SourceMinesDomeRow) => void
  onDelete: (row: SourceMinesDomeRow) => void
}

type CheckState = boolean | "indeterminate"
export type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
  showDumping?: boolean
  showCategory?: boolean
}

function fmtStatus(v: number | null | undefined) {
  if (v === null || v === undefined) return "-"
  if (v === 1) return "Active"
  if (v === 0) return "Inactive"
  return String(v)
}

function fmtText(v: string | null | undefined) {
  const s = (v ?? "").trim()
  return s ? s : "-"
}

export function getSourceMinesDomeColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<SourceMinesDomeRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? role !== "SITE_USER"
  const canMutate = role !== "GLOBAL_VIEWER"

  const showDumping = opts.showDumping ?? true
  const showCategory = opts.showCategory ?? true

  const cols: ColumnDef<SourceMinesDomeRow>[] = [
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

    // pile_id (utama)
    {
      accessorKey: "pile_id",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Pile / Dome" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, fmtText(row.original.pile_id)),
    },

    // dumping point
    ...(showDumping
      ? [
        {
          accessorKey: "dumping_label",
          header: ({ column }: any) => h(DataTableColumnHeader, { column, title: "Dumping Point" }),
          enableSorting: false,
          cell: ({ row }: any) =>
            h(
              "div",
              { class: "text-muted-foreground" },
              row.original.dumping_label ??
              (row.original.dumping != null ? `#${row.original.dumping}` : "-")
            ),
        } as ColumnDef<SourceMinesDomeRow>,
      ]
      : []),

    ...(showCategory
      ? [
        {
          accessorKey: "category",
          header: ({ column }: any) => h(DataTableColumnHeader, { column, title: "Category" }),
          enableSorting: true,
          cell: ({ row }: any) =>
            h("div", { class: "text-muted-foreground" }, fmtText(row.original.category)),
        } as ColumnDef<SourceMinesDomeRow>,
      ]
      : []),

    {
      accessorKey: "plan_ni_min",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Min Ni (%)" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "text-muted-foreground" }, row.original.plan_ni_min ?? "-"),
    },
    {
      accessorKey: "plan_ni_max",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Max Ni (%)" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "text-muted-foreground" }, row.original.plan_ni_max ?? "-"),
    },

    ...(showIup
      ? [
        {
          accessorKey: "iup_code",
          header: ({ column }: any) => h(DataTableColumnHeader, { column, title: "IUP Code" }),
          enableSorting: true,
          cell: ({ row }: any) =>
            h("div", { class: "text-muted-foreground" }, row.original.iup_code ?? "-"),
        } as ColumnDef<SourceMinesDomeRow>,
      ]
      : []),

    {
      accessorKey: "direct_sale",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Direct" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "text-muted-foreground" }, row.original.direct_sale),
    },
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
        } as ColumnDef<SourceMinesDomeRow>,
      ]
      : []),
  ]

  return cols
}