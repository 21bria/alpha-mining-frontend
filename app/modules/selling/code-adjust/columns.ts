import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import type { UserRole } from "@/utils/roles"

export type CodeAdjustmentRow = {
  id: number

  code_lot: number | null
  code_lot_code?: string | null

  iup?: number | null
  iup_code?: string | null
  iup_name?: string | null

  date_arrival?: string | null
  date_departure?: string | null
  jetty_departure?: string | null

  ritase_ori?: number | null
  tonnage_ori?: number | null
  tonnage_adjust?: number | null

  status?: string | null
  description?: string | null

  user?: number | null
  user_id?: number | null
  username?: string | null

  created_at?: string | null
  updated_at?: string | null
}

type ColumnActions = {
  onEdit: (row: CodeAdjustmentRow) => void
  onDelete: (row: CodeAdjustmentRow) => void
}

type CheckState = boolean | "indeterminate"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

function formatNumber(
  value: number | string | null | undefined,
  digits = 2
) {
  if (value === null || value === undefined || value === "") return "-"
  const num = Number(value)
  if (Number.isNaN(num)) return "-"
  return num.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function getCodeAdjustmentColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<CodeAdjustmentRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? role !== "SITE_USER"
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<CodeAdjustmentRow>[] = [
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
          // {
          //   accessorKey: "iup_code",
          //   header: ({ column }: any) =>
          //     h(DataTableColumnHeader, { column, title: "IUP Code" }),
          //   enableSorting: true,
          //   cell: ({ row }: any) =>
          //     h("div", { class: "font-medium" }, row.original.iup_code ?? "-"),
          // },
          {
            accessorKey: "iup_name",
            header: ({ column }: any) =>
              h(DataTableColumnHeader, { column, title: "IUP Name" }),
            enableSorting: true,
            cell: ({ row }: any) =>
              h("div", { class: "font-medium" }, row.original.iup_name ?? "-"),
          },
        ]
      : []),

    {
      accessorKey: "code_lot_code",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Code Lot" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.code_lot_code ?? "-"),
    },

    {
      accessorKey: "date_arrival",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Date Arrival" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", {}, row.original.date_arrival ?? "-"),
    },

    {
      accessorKey: "date_departure",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Date Departure" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", {}, row.original.date_departure ?? "-"),
    },

    {
      accessorKey: "jetty_departure",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Jetty Departure" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", {}, row.original.jetty_departure ?? "-"),
    },

    {
      accessorKey: "ritase_ori",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Ritase" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "font-medium text-right" },
          formatNumber(row.original.ritase_ori, 0)
        ),
    },

    {
      accessorKey: "tonnage_ori",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Tonnage Ori" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "font-medium text-right" },
          formatNumber(row.original.tonnage_ori, 2)
        ),
    },

    {
      accessorKey: "tonnage_adjust",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Tonnage Adjust" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "font-medium text-right" },
          formatNumber(row.original.tonnage_adjust, 2)
        ),
    },

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
        h(
          "div",
          { class: "max-w-[320px] truncate" },
          row.original.description ?? "-"
        ),
    },

    {
      accessorKey: "username",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Created By" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground" },
          row.original.username ?? "-"
        ),
    },

    {
      accessorKey: "created_at",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Created At" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground" },
          row.original.created_at ?? "-"
        ),
    },

    // {
    //   accessorKey: "updated_at",
    //   header: ({ column }) =>
    //     h(DataTableColumnHeader, { column, title: "Updated At" }),
    //   enableSorting: true,
    //   cell: ({ row }) =>
    //     h(
    //       "div",
    //       { class: "text-muted-foreground" },
    //       row.original.updated_at ?? "-"
    //     ),
    // },

    ...(canMutate
      ? [
          {
            id: "actions",
            header: () => h("div", { class: "text-left" }, "Actions"),
            cell: ({ row }: { row: { original: CodeAdjustmentRow } }) =>
              h("div", { class: "flex justify-end" }, [
                h(DataTableRowActions, {
                  row: row.original,
                  onEdit: actions.onEdit,
                  onDelete: actions.onDelete,
                }),
              ]),
          } as ColumnDef<CodeAdjustmentRow>,
        ]
      : []),
  ]

  return cols
}