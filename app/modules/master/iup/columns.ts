import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader.vue'
import DataTableRowActions from './components/DataTableRowActions.vue'

type GeoJSONGeometry =
  | { type: "Point"; coordinates: [number, number] }
  | { type: "LineString"; coordinates: [number, number][] }
  | { type: "Polygon"; coordinates: [number, number][][] }
  | { type: "MultiPolygon"; coordinates: [number, number][][][] }
  | { type: string; coordinates: any } // fallback

export type IUPRow = {
  id: number
  iup_code: string
  iup_name: string
  geometry: GeoJSONGeometry | null
  center_lat: number | null
  center_lng: number | null
  default_zoom: number | null
}
type ColumnActions = {
  onEdit: (row: IUPRow) => void
  onDelete: (row: IUPRow) => void
}
type CheckState = boolean | "indeterminate"
export function getIUPColumns(actions: ColumnActions): ColumnDef<IUPRow>[] {
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
      accessorKey: "iup_code",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "IUP Code" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.iup_code),
    },

    {
      accessorKey: "iup_name",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "IUP Name" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.iup_name),
    },

    {
      accessorKey: "center_lat",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Lat" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground tabular-nums" },
          row.original.center_lat ?? "-"
        ),
    },

    {
      accessorKey: "center_lng",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Lng" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground tabular-nums" },
          row.original.center_lng ?? "-"
        ),
    },

    {
      accessorKey: "default_zoom",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Zoom" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground tabular-nums" },
          row.original.default_zoom ?? "-"
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