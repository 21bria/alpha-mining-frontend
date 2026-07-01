import type { NavLink, NavGroup } from "~/types/nav"

export type MasterCategory =
  | "Sources"
  | "Materials"
  | "Equipment"
  | "Sample"
  | "Geology"

export type MasterItem =
  | (NavLink & { category?: MasterCategory })
  | (NavGroup & { category?: MasterCategory })

export const masterItems: MasterItem[] = [
  {
    title: "Data IUP",
    icon: "i-lucide-map",
    category: "Sources",
    link: "/master/sources",
    require: { any: ["master.view_mineiup"] },
  },
  {
    title: "Sources",
    icon: "i-lucide-map-pin-house",
    category: "Sources",
    link: "/master/sources/mine-source",
    require: { any: ["master.view_sourcemines"] },
  },
  {
    title: "Blocks",
    icon: "i-lucide-grid-2x2",
    category: "Sources",
    link: "/master/sources/mine-block",
    require: { any: ["master.view_block"] },
  },
  {
    title: "Loading Points",
    icon: "i-lucide-map-pinned",
    category: "Sources",
    link: "/master/sources/mine-loading",
    require: { any: ["master.view_sourceminesloading"] },
  },
  {
    title: "Pit Dome",
    icon: "i-lucide-git-pull-request-create-arrow",
    category: "Sources",
    link: "/master/sources/mine-pit-dome",
    require: { any: ["master.view_sourcepitdome"] },
  },
  {
    title: "Dumping Points",
    icon: "i-lucide-map-pinned",
    category: "Sources",
    link: "/master/sources/mine-dumping",
    require: { any: ["master.view_sourceminesdumping"] },
  },
  {
    title: "Dome Points",
    icon: "i-lucide-warehouse",
    category: "Sources",
    link: "/master/sources/mine-dome",
    require: { any: ["master.view_sourceminesdome"] },
  },

  {
    title: "Materials",
    icon: "i-lucide-arrow-down-z-a",
    category: "Materials",
    link: "/master/materials",
    require: { any: ["master.view_material"] },
  },
  {
    title: "Vendors",
    icon: "i-lucide-columns-3-cog",
    category: "Equipment",
    link: "/master/vendors",
    require: { any: ["master.view_vendors"] },
  },
  {
    title: "Mine Units",
    icon: "i-lucide-tram-front",
    category: "Equipment",
    link: "/master/units",
    require: { any: ["master.view_unitscategories", "master.view_mineunits"] },
  },
  {
    title: "Mine Activity",
    icon: "i-lucide-split",
    category: "Equipment",
    link: "/master/activity",
    require: { any: ["master.view_unitscategories", "master.view_locations"] },
  },
  {
    title: "Sample Type",
    icon: "i-lucide-scan-text",
    category: "Sample",
    link: "/master/sample/type",
    require: { any: ["master.view_sampletype", "master.view_samplemethod"] },
  },
  {
    title: "Grade Control",
    icon: "i-lucide-users-round",
    category: "Geology",
    link: "/master/grade-control",
    require: { any: ["master.view_minegeologies"] },
  },
]