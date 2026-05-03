import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import type { UserRole } from "@/utils/roles"

export type planProductionsRow = {
  id: number
  iup_id: number | null
  iup_code: string | null
  iup_name: string | null
  category: string | null
  date_plan: string | null

  sources: string | null
  vendors: string | null

  topsoil: string | null
  ob: number | null
  waste: number | null
  lim: number | null
  sap: number | null
  quarry: number | null
  ballast: number | null
  biomass: number | null


  user_id: number | null
  user: string | null
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
  onEdit: (row: planProductionsRow) => void
  onDelete: (row: planProductionsRow) => void
}

type CheckState = boolean | "indeterminate"
type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}
export function getplanProductionsColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<planProductionsRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"
  const cols: ColumnDef<planProductionsRow>[] = [
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
      accessorKey: "date_plan",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Date plan" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.date_plan ?? "-"),
    },
    {
      accessorKey: "category",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Categories" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.category ?? "-"),
    },
    {
      accessorKey: "sources",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Source" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.sources ?? "-"),
    },
    {
      accessorKey: "vendors",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Vendors" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.vendors ?? "-"),
    },
    {
      accessorKey: "topsoil",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Top soil" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, formatNumber(row.original.topsoil) ?? "-"),
    },
    {
      accessorKey: "ob",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "OB" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, formatNumber(row.original.ob) ?? "-"),
    },
    {
      accessorKey: "waste",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Waste" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, formatNumber(row.original.waste) ?? "-"),
    },

    {
      accessorKey: "lim",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "LIM" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, formatNumber(row.original.lim) ?? "-"),
    },
    {
      accessorKey: "sap",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "SAP" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, formatNumber(row.original.sap) ?? "-"),
    },

    {
      accessorKey: "quarry",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Quarry" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, formatNumber(row.original.quarry) ?? "-"),
    },

    {
      accessorKey: "ballast",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Ballast" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, formatNumber(row.original.ballast) ?? "-"),
    },

    {
      accessorKey: "biomass",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Biomass" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, formatNumber(row.original.biomass) ?? "-"),
    },

    {
      accessorKey: "user",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Created By" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.user ?? "-"),
    },
    ...(showIup
      ? [
        {
          accessorKey: "iup_code",
          header: ({ column }) =>
            h(DataTableColumnHeader, { column, title: "IUP Code" }),
          enableSorting: true,
          cell: ({ row }) =>
            h("div", { class: "text-muted-foreground" }, row.original.iup_code ?? "-"),
        } as ColumnDef<planProductionsRow>,
      ]
      : []),
    // ...(canMutate
    //   ? [
    //     {
    //       id: "actions",
    //       header: () => h("div", { class: "text-left" }, "Actions"),
    //       cell: ({ row }: { row: { original: planProductionsRow } }) =>
    //         h("div", { class: "flex justify-end" }, [
    //           h(DataTableRowActions, {
    //             row: row.original,
    //             onEdit: actions.onEdit,
    //             onDelete: actions.onDelete,
    //           }),
    //         ]),
    //     } as ColumnDef<planProductionsRow>,
    //   ]
    //   : []),
  ]
  return cols
}