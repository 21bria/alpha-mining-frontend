import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import type { UserRole } from "@/utils/roles"

export type ActivityLocationsRow = {
  id: string | number
  iup: number | null
  iup_code: string | null
  iup_name: string | null
  name: string | null
  code: string | null
  description: string | null
  user: number | null
}

type ColumnActions = {
  onEdit: (row: ActivityLocationsRow) => void
  onDelete: (row: ActivityLocationsRow) => void
}

type CheckState = boolean | "indeterminate"
type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}


export function getActivityLocationsRow(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<ActivityLocationsRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<ActivityLocationsRow>[] = [
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
      accessorKey: "name",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Name" }),
      enableSorting: true,
      cell: ({ row }: any) =>
        h("div",  row.original.name ?? "-"),
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
        } as ColumnDef<ActivityLocationsRow>,
      ]
      : []),


    {
      accessorKey: "code",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Code" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground line-clamp-2" }, row.original.code ?? "-"),
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
        } as ColumnDef<ActivityLocationsRow>,
      ]
      : []),
  ]

  return cols
}