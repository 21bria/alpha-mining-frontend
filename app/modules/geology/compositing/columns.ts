import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import { formatDate, formatDateTime } from "@/utils/formatDate.js"
import type { UserRole } from "@/utils/roles"

export type DomeMergeRow = {
  id: number

  iup?: number | null
  iup_code?: string | null
  iup_name?: string | null

  original_dome: number | null
  original_dome_code?: string | null
  original_dome_name?: string | null
  tonnage_primary: number | null

  dome_second: number | null
  dome_second_code?: string | null
  dome_second_name?: string | null
  tonnage_second: number | null

  ref_id?: string | null
  status?: string | null

  // TAMBAHKAN 
  is_undone?: boolean | null
  undone_at?: string | null
  undone_by_id?: number | null
  undone_by_username?: string | null
  undo_notes?: string | null

  description?: string | null

  user_id?: number | null
  username?: string | null

  created_at?: string | null
  updated_at?: string | null
}

type ColumnActions = {
  onView?: (row: DomeMergeRow) => void
  onUndo?: (row: DomeMergeRow) => void
  onDelete?: (row: DomeMergeRow) => void
}

type CheckState = boolean | "indeterminate"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value == null || Number.isNaN(Number(value))) return "-"
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function getDomeMergeColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<DomeMergeRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<DomeMergeRow>[] = [
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

    ...(showIup
      ? [
        {
          accessorKey: "iup_name",
          header: ({ column }) =>
            h(DataTableColumnHeader, { column, title: "IUP Name" }),
          enableSorting: true,
          cell: ({ row }) =>
            h("div", { class: "text-muted-foreground" }, row.original.iup_name ?? "-"),
        } as ColumnDef<DomeMergeRow>,
      ]
      : []),

    {
      accessorKey: "original_dome_code",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Original Dome" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.original_dome_code ?? "-"),
    },

    // {
    //   accessorKey: "original_dome_name",
    //   header: ({ column }) =>
    //     h(DataTableColumnHeader, { column, title: "Original Dome Name" }),
    //   enableSorting: true,
    //   cell: ({ row }) =>
    //     h("div", { class: "font-medium" }, row.original.original_dome_name ?? "-"),
    // },

    {
      accessorKey: "tonnage_primary",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Tonnage" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium text-right" }, formatNumber(row.original.tonnage_primary, 2)),
    },

    {
      accessorKey: "dome_second_code",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Target Dome" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.dome_second_code ?? "-"),
    },

    // {
    //   accessorKey: "dome_second_name",
    //   header: ({ column }) =>
    //     h(DataTableColumnHeader, { column, title: "Target Dome Name" }),
    //   enableSorting: true,
    //   cell: ({ row }) =>
    //     h("div", { class: "font-medium" }, row.original.dome_second_name ?? "-"),
    // },

    {
      accessorKey: "tonnage_second",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Target Tonnage" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium text-right" }, formatNumber(row.original.tonnage_second, 2)),
    },

    // {
    //   accessorKey: "ref_id",
    //   header: ({ column }) =>
    //     h(DataTableColumnHeader, { column, title: "Reference ID" }),
    //   enableSorting: true,
    //   cell: ({ row }) =>
    //     h("div", { class: "text-muted-foreground" }, row.original.ref_id ?? "-"),
    // },

    {
      accessorKey: "status",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Status" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.status ?? "-"),
    },

    {
      accessorKey: "description",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Description" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "max-w-[320px] truncate" }, row.original.description ?? "-"),
    },

    {
      accessorKey: "username",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Created By" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, row.original.username ?? "-"),
    },

    {
      accessorKey: "created_at",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Created At" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, formatDateTime(row.original.created_at ?? "-")),
    },

    ...(canMutate
      ? [
        {
          id: "actions",
          header: () => h("div", { class: "text-left" }, "Actions"),
          cell: ({ row }: { row: { original: DomeMergeRow } }) =>
            h("div", { class: "flex justify-end" }, [
              h(DataTableRowActions, {
                row: row.original,
                onView: actions.onView,
                onUndo: actions.onUndo,
                onDelete: actions.onDelete,
                canUndo: !row.original.is_undone && row.original.status !== "UNDONE",
              }),
            ]),
        } as ColumnDef<DomeMergeRow>
      ]
      : []),
  ]

  return cols
}