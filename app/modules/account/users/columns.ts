import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"

export type usersRow = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  role: string
  default_iup_id: number
  allowed_iup_ids: number[]
  groups: string[]
  groups_detail: { id: number, name: string }[]
}

type ColumnActions = {
  onEdit: (row: usersRow) => void
  onDelete: (row: usersRow) => void
}

type CheckState = boolean | "indeterminate"

export function getUsersColumns(actions: ColumnActions): ColumnDef<usersRow>[] {
  return [
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
      accessorKey: "username",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Username" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.username),
    },

    {
      accessorKey: "email",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Email" }),
      enableSorting: true,
      cell: ({ row }) => h("div", {}, row.original.email),
    },

    {
      id: "name",
      accessorFn: (r) => `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Name" }),
      enableSorting: true,
      cell: ({ row }) => {
        const fullName = `${row.original.first_name ?? ""} ${row.original.last_name ?? ""}`.trim()
        return h("div", { class: "font-medium" }, fullName || "-")
      },
    },

    {
      accessorKey: "role",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Role" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "capitalize" }, row.original.role),
    },

    //  GROUPS (array)
    {
      id: "groups",
      accessorFn: (r) => (r.groups_detail ?? []).map(g => g.name).join(", "),
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Groups" }),
      cell: ({ row }) => {
        const txt = (row.original.groups_detail ?? []).map(g => g.name).join(", ")
        return h("div", { class: "capitalize" }, txt || "-")
      },
    },
    //  Default IUP
    {
      accessorKey: "default_iup_id",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Default IUP" }),
      enableSorting: true,
      cell: ({ row }) => h("div", {}, String(row.original.default_iup_id ?? "-")),
    },

    //  Allowed IUPs (list)
    {
      id: "allowed_iups",
      accessorFn: (r) => (r.allowed_iup_ids ?? []).join(", "),
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Allowed IUPs" }),
      enableSorting: false,
      cell: ({ row }) => {
        const txt = (row.original.allowed_iup_ids ?? []).join(", ")
        return h("div", {}, txt || "-")
      },
    },

    {
      accessorKey: "is_active",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Status" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: row.original.is_active ? "text-green-600" : "text-red-600" },
          row.original.is_active ? "Active" : "Inactive"
        ),
    },

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
    },
  ]
}