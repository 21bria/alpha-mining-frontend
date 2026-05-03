import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import type { UserRole } from "@/utils/roles"

export type bargingPlanRow = {
  id: string
  code: string | null

  iup_id: number | null
  iup_code: string | null
  iup_name: string | null

  plan_date: string | null

  tugboat_name: string | null
  barge_code: string | null

  tonnage_plan: number | null
  no_plan: number | null

  description: string | null

  id_user: number | null
  created_at: string | null
}

function formatNumber(value: number | string | null | undefined, digits = 2) {
  if (value === null || value === undefined || value === "") return "-"
  const num = Number(value)
  if (Number.isNaN(num)) return "-"
  return num.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

type ColumnActions = {
  onEdit: (row: bargingPlanRow) => void
  onDelete: (row: bargingPlanRow) => void
}

type CheckState = boolean | "indeterminate"
type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}
export function getBargingPlanColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<bargingPlanRow>[] {

  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")

  const cols: ColumnDef<bargingPlanRow>[] = [

    // SELECT
    {
      id: "select",
      header: ({ table }) =>
        h(Checkbox, {
          modelValue: table.getIsAllPageRowsSelected(),
          "onUpdate:modelValue": (v: CheckState) =>
            table.toggleAllPageRowsSelected(v === true),
          indeterminate: table.getIsSomePageRowsSelected(),
          onClick: (e: MouseEvent) => e.stopPropagation(),
        }),
      cell: ({ row }) =>
        h(Checkbox, {
          modelValue: row.getIsSelected(),
          "onUpdate:modelValue": (v: CheckState) =>
            row.toggleSelected(v === true),
          onClick: (e: MouseEvent) => e.stopPropagation(),
        }),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    // DATE
    {
      accessorKey: "plan_date",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Plan Date" }),
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.plan_date ?? "-"),
    },

    // TUGBOAT
    {
      accessorKey: "tugboat_name",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Tugboat" }),
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.tugboat_name ?? "-"),
    },

    // BARGE CODE
    {
      accessorKey: "barge_code",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Barge Code" }),
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.barge_code ?? "-"),
    },

    // TONNAGE
    {
      accessorKey: "tonnage_plan",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Tonnage Plan" }),
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, formatNumber(row.original.tonnage_plan)),
    },

    // NO PLAN
    {
      accessorKey: "no_plan",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "No Plan" }),
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.no_plan ?? "-"),
    },

    // DESCRIPTION
    {
      accessorKey: "description",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Description" }),
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, row.original.description ?? "-"),
    },

    // CREATED
    {
      accessorKey: "created_at",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Created At" }),
      cell: ({ row }) =>
        h("div", {}, row.original.created_at ?? "-"),
    },

    // IUP (optional)
    ...(showIup
      ? [
          {
            accessorKey: "iup_code",
            header: ({ column }) =>
              h(DataTableColumnHeader, { column, title: "IUP Code" }),
            cell: ({ row }) =>
              h("div", { class: "text-muted-foreground" }, row.original.iup_code ?? "-"),
          } as ColumnDef<bargingPlanRow>,
        ]
      : []),
  ]

  return cols
}