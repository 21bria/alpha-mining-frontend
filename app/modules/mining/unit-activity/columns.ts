import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import type { UserRole } from "@/utils/roles"

export type HmUnitRow = {
  id: string

  iup_id?: number | null
  iup_code?: string | null
  iup_name?: string | null

  unit_id?: string | null
  unit_code?: string | null
  unit_model?: string | null

  date: string | null
  shift: string | null

  hm_start: number | null
  hm_end: number | null
  hm_total?: number | null

  total_details?: number | null
  total_duration_min?: number | null

  status: string | null

  user_id?: number | null
  username?: string | null
}

type ColumnActions = {
  onView: (row: HmUnitRow) => void
  onEdit: (row: HmUnitRow) => void
  onDelete: (row: HmUnitRow) => void
}

type CheckState = boolean | "indeterminate"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value == null || Number.isNaN(Number(value))) return "-"
  return Number(value).toFixed(digits)
}

export function getHmUnitColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<HmUnitRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<HmUnitRow>[] = [
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
      accessorKey: "date",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Date" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.date ?? "-"),
    },

    {
      accessorKey: "shift",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Shift" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.shift ?? "-"),
    },

    {
      accessorKey: "unit_code",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Unit" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.unit_code ?? "-"),
    },

    {
      accessorKey: "hm_start",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "HM Start" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, formatNumber(row.original.hm_start)),
    },

    {
      accessorKey: "hm_end",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "HM End" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, formatNumber(row.original.hm_end)),
    },

    {
      accessorKey: "hm_total",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "HM Total" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "font-semibold text-primary" },
          formatNumber(row.original.hm_total)
        ),
    },

    {
      accessorKey: "total_details",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Details" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "button",
          {
            class:
              "font-medium text-blue-600 hover:underline disabled:text-muted-foreground disabled:no-underline",
            onClick: () => actions.onView(row.original),
            disabled: !row.original.id,
          },
          String(row.original.total_details ?? 0)
        ),
    },

    {
      accessorKey: "status",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Status" }),
      enableSorting: true,
      cell: ({ row }) => {
        const value = row.original.status ?? "-"
        const cls =
          value === "APPROVED"
            ? "bg-green-100 text-green-700"
            : value === "SUBMITTED"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-700"

        return h(
          "span",
          {
            class: `inline-flex rounded px-2 py-1 text-xs font-medium ${cls}`,
          },
          value
        )
      },
    },

    {
      accessorKey: "username",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Created By" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, row.original.username ?? "-"),
    },

    ...(showIup
      ? [
          {
            accessorKey: "iup_code",
            header: ({ column }) =>
              h(DataTableColumnHeader, { column, title: "IUP" }),
            enableSorting: true,
            cell: ({ row }) =>
              h(
                "div",
                { class: "text-muted-foreground" },
                row.original.iup_code ?? "-"
              ),
          } as ColumnDef<HmUnitRow>,
        ]
      : []),

    {
      id: "view",
      header: () => h("div", { class: "text-left" }, "View"),
      cell: ({ row }) =>
        h(
          "button",
          {
            class: "text-blue-600 hover:underline text-sm",
            onClick: () => actions.onView(row.original),
          },
          "view"
        ),
      enableSorting: false,
      enableHiding: false,
    },

    ...(canMutate
      ? [
          {
            id: "actions",
            header: () => h("div", { class: "text-right" }, "Actions"),
            cell: ({ row }) =>
              h("div", { class: "flex justify-end" }, [
                h(DataTableRowActions, {
                  row: row.original,
                  onEdit: actions.onEdit,
                  onDelete: actions.onDelete,
                }),
              ]),
            enableSorting: false,
            enableHiding: false,
          } as ColumnDef<HmUnitRow>,
        ]
      : []),
  ]

  return cols
}