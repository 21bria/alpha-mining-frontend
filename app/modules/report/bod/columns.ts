import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"

import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"

import type { UserRole } from "@/utils/roles"

export type BodWeeklyReportRow = {
  id: string

  report_code: string | null
  title: string | null

  iup: number | null
  iup_code: string | null
  iup_name: string | null

  year: number | null
  week: number | null

  period_start: string | null
  period_end: string | null

  status: string | null

  username?: string | null
}

type ColumnActions = {
  onEdit: (row: BodWeeklyReportRow) => void
  onDelete: (row: BodWeeklyReportRow) => void
}

type CheckState = boolean | "indeterminate"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

function fmtDate(v?: string | null) {
  if (!v)
    return "-"

  return new Date(v).toLocaleDateString("id-ID")
}

export function getBodWeeklyReportColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {},
): ColumnDef<BodWeeklyReportRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"

  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<BodWeeklyReportRow>[] = [
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
          } as ColumnDef<BodWeeklyReportRow>,
        ]
      : []),

    {
      accessorKey: "year",

      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: "Year",
        }),

      enableSorting: true,
    },

    {
      accessorKey: "week",

      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: "Week",
        }),

      enableSorting: true,

      cell: ({ row }) =>
        h(
          "div",
          { class: "font-medium" },
          row.original.week
            ? `Week ${row.original.week}`
            : "-",
        ),
    },

    {
      accessorKey: "period_start",

      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: "Period",
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
          } as ColumnDef<BodWeeklyReportRow>,
        ]
      : []),
  ]

  return cols
}