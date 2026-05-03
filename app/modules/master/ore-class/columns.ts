import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import type { UserRole } from "@/utils/roles"

export type OreClassRow = {
  id: number
  code: string | null

  iup: number | null
  iup_code: string | null
  iup_name: string | null

  material: number | null
  material_code: string | null
  material_name: string | null

  ore_class: string | null

  ni_min: number | null
  ni_max: number | null

  mgo_min: number | null
  mgo_max: number | null

  fe_min: number | null
  fe_max: number | null

  status: boolean | null

  user?: number | null
  user_id?: number | null
  username?: string | null
}

type ColumnActions = {
  onEdit: (row: OreClassRow) => void
  onDelete: (row: OreClassRow) => void
}

type CheckState = boolean | "indeterminate"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

function fmtStatus(v: boolean | null | undefined) {
  if (v === null || v === undefined) return "-"
  return v ? "Active" : "Inactive"
}

function fmtRange(min: number | null | undefined, max: number | null | undefined) {
  const minVal = min ?? "(Min)"
  const maxVal = max ?? "(Max)"
  return `${minVal} - ${maxVal}`
}

export function getOreClassColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<OreClassRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<OreClassRow>[] = [
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
      accessorKey: "code",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Code" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.code ?? "-"),
    },

    {
      accessorKey: "ore_class",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Ore Class" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.ore_class ?? "-"),
    },

    {
      accessorKey: "material_name",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Material" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground" },
          row.original.material_name
            ? `${row.original.material_name}${row.original.material_code ? ` (${row.original.material_code})` : ""}`
            : "-"
        ),
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
          } as ColumnDef<OreClassRow>,
        ]
      : []),

    {
      id: "ni_range",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Ni Range" }),
      accessorFn: (row) => `${row.ni_min ?? ""}${row.ni_max ?? ""}`,
      enableSorting: false,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, fmtRange(row.original.ni_min, row.original.ni_max)),
    },

    {
      id: "mgo_range",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "MgO Range" }),
      accessorFn: (row) => `${row.mgo_min ?? ""}-${row.mgo_max ?? ""}`,
      enableSorting: false,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, fmtRange(row.original.mgo_min, row.original.mgo_max)),
    },

    {
      id: "fe_range",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Fe Range" }),
      accessorFn: (row) => `${row.fe_min ?? ""}-${row.fe_max ?? ""}`,
      enableSorting: false,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, fmtRange(row.original.fe_min, row.original.fe_max)),
    },

    {
      accessorKey: "status",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Status" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, fmtStatus(row.original.status)),
    },

    ...(canMutate
      ? [
          {
            id: "actions",
            header: () => h("div", { class: "text-left" }, "Actions"),
            cell: ({ row }: any) =>
              h("div", { class: "flex justify-end" }, [
                h(DataTableRowActions, {
                  row: row.original,
                  onEdit: actions.onEdit,
                  onDelete: actions.onDelete,
                }),
              ]),
          } as ColumnDef<OreClassRow>,
        ]
      : []),
  ]

  return cols
}