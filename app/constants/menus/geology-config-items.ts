import type { NavLink } from "~/types/nav"

export type GeologyConfigCategory = "Master" | "Adjustment" | "Status"

export type GeologyConfigItem = NavLink & {
  category?: GeologyConfigCategory
}

export const geologyConfigItems: GeologyConfigItem[] = [
  {
    title: "Ore Class",
    icon: "i-lucide-gem",
    category: "Master",
    link: "/master/ore-class",
    require: { any: ["master.view_oreclass"] },
  },
  {
    title: "Fill Factors",
    icon: "i-lucide-calculator",
    category: "Master",
    link: "/master/fill-factors",
    require: { any: ["master.view_oretruckfactor"] },
  },
  {
    title: "Ore Adjust",
    icon: "i-lucide-sliders-horizontal",
    category: "Adjustment",
    link: "/geology/ore-adjust",
    require: { any: ["geology.view_oreadjustment"] },
  },
  {
    title: "Dome Adjust",
    icon: "i-lucide-warehouse",
    category: "Adjustment",
    link: "/geology/dome-adjust",
    require: { any: ["geology.view_domeadjustment"] },
  },
  {
    title: "Dome Status",
    icon: "i-lucide-circle-check",
    category: "Status",
    link: "/geology/dome-status",
    require: { any: ["geology.view_domestatusclose"] },
  },
  {
    title: "Compositing",
    icon: "i-lucide-layers-3",
    category: "Adjustment",
    link: "/geology/compositing",
    require: { any: ["geology.view_domemerge"] },
  },
]