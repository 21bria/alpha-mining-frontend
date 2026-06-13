import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"

import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"

import type { UserRole } from "@/utils/roles"

export type ReportManagementRow = {
  id: string

  report_code: string | null
  title: string | null

  iup: number | null
  iup_code: string | null
  iup_name: string | null

  period_type: "WEEKLY" | "MONTHLY" | "YEARLY" | "RANGE" | string | null
  period_key: string | null

  yearly: number | null
  monthly: number | null
  weekly: number | null

  period_start: string | null
  period_end: string | null

  status: string | null

  username?: string | null
}

type ColumnActions = {
  onEdit: (row: ReportManagementRow) => void
  onDelete: (row: ReportManagementRow) => void
}

type CheckState = boolean | "indeterminate"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

function fmtDate(v?: string | null) {
  if (!v) return "-"
  return new Date(v).toLocaleDateString("id-ID")
}

function fmtPeriod(row: ReportManagementRow) {
  if (row.period_type === "WEEKLY") {
    return row.weekly ? `Week ${row.weekly}` : row.period_key ?? "-"
  }

  if (row.period_type === "MONTHLY") {
    return row.monthly && row.yearly
      ? `${String(row.monthly).padStart(2, "0")}/${row.yearly}`
      : row.period_key ?? "-"
  }

  if (row.period_type === "YEARLY") {
    return row.yearly ? `${row.yearly}` : row.period_key ?? "-"
  }

  if (row.period_type === "RANGE") {
    return `${fmtDate(row.period_start)} - ${fmtDate(row.period_end)}`
  }

  return row.period_key ?? "-"
}

export function getReportManagementColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {},
): ColumnDef<ReportManagementRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"

  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<ReportManagementRow>[] = [
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

          "onUpdate:modelValue": (v: CheckState) =>
            row.toggleSelected(v === true),

          onClick: (e: MouseEvent) => e.stopPropagation(),

          "aria-label": "Select row",

          disabled: !canMutate,
        }),

      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    {
      accessorKey: "report_code",

      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: "Code",
        }),

      enableSorting: true,

      cell: ({ row }) =>
        h(
          "div",
          { class: "font-medium" },
          row.original.report_code ?? "-",
        ),
    },

    {
      accessorKey: "title",

      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: "Title",
        }),

      enableSorting: true,

      cell: ({ row }) =>
        h(
          "div",
          { class: "font-medium" },
          row.original.title ?? "-",
        ),
    },

    ...(showIup
      ? [
          {
            accessorKey: "iup_code",

            header: ({ column }: any) =>
              h(DataTableColumnHeader, {
                column,
                title: "IUP",
              }),

            enableSorting: true,

            cell: ({ row }: any) =>
              h(
                "div",
                { class: "text-muted-foreground" },
                row.original.iup_code
                  ? `${row.original.iup_code} - ${row.original.iup_name ?? ""}`
                  : "-",
              ),
          } as ColumnDef<ReportManagementRow>,
        ]
      : []),

    {
      accessorKey: "period_type",

      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: "Type",
        }),

      enableSorting: true,

      cell: ({ row }) =>
        h(
          "div",
          { class: "font-medium" },
          row.original.period_type ?? "-",
        ),
    },

    {
      accessorKey: "period_key",

      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: "Period",
        }),

      enableSorting: true,

      cell: ({ row }) =>
        h(
          "div",
          { class: "font-medium whitespace-nowrap" },
          fmtPeriod(row.original),
        ),
    },

    {
      accessorKey: "period_start",

      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: "Date Range",
        }),

      enableSorting: false,

      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground whitespace-nowrap" },
          `${fmtDate(row.original.period_start)} - ${fmtDate(row.original.period_end)}`,
        ),
    },

    {
      accessorKey: "status",

      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: "Status",
        }),

      enableSorting: true,

      cell: ({ row }) =>
        h(
          "div",
          {
            class:
              row.original.status === "Published"
                ? "font-medium text-green-600"
                : row.original.status === "Archived"
                  ? "font-medium text-orange-600"
                  : "text-muted-foreground",
          },
          row.original.status ?? "-",
        ),
    },

    {
      accessorKey: "username",

      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: "Created By",
        }),

      enableSorting: true,

      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground" },
          row.original.username ?? "-",
        ),
    },

    ...(canMutate
      ? [
          {
            id: "actions",

            header: () =>
              h(
                "div",
                { class: "text-left" },
                "Actions",
              ),

            cell: ({ row }: any) =>
              h(
                "div",
                { class: "flex justify-end" },
                [
                  h(DataTableRowActions, {
                    row: row.original,

                    onEdit: actions.onEdit,
                    onDelete: actions.onDelete,
                  }),
                ],
              ),
          } as ColumnDef<ReportManagementRow>,
        ]
      : []),
  ]

  return cols
}