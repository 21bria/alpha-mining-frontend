import type { NavLink } from "~/types/nav"

export type SellingCategory =
  | "Blending"
  | "Adjustment"
  | "Master"

export type SellingItem = NavLink & {
  category?: SellingCategory
}

export const sellingItems: SellingItem[] = [
 
  // =========================
  // BLENDING
  // =========================
  {
    title: "Blending Form",
    icon: "i-lucide-grid-2x2-check",
    category: "Blending",
    link: "/selling/blending",
    require: { any: ["selling.view_blendingdetail"] },
  },

  // =========================
  // ADJUSTMENT
  // =========================
  {
    title: "Adjust Selling",
    icon: "i-lucide-sliders-horizontal",
    category: "Adjustment",
    link: "/selling/code-adjust",
    require: { any: ["selling.view_sellingbargingadjustment"] },
  },
  {
    title: "Transfer Selling",
    icon: "i-lucide-list-chevrons-down-up",
    category: "Adjustment",
    link: "/selling/transfers",
    require: { any: ["selling.view_dometransfer"] },
  },

  // =========================
  // MASTER
  // =========================
  {
    title: "Code Selling",
    icon: "i-lucide-code-2",
    category: "Master",
    link: "/master/selling-code",
    require: { any: ["master.view_sellingcode"] },
  },
  {
    title: "Barge Selling",
    icon: "i-lucide-ship",
    category: "Master",
    link: "/master/barge",
    require: { any: ["master.view_bargeunits"] },
  },
  {
    title: "Factory Selling",
    icon: "i-lucide-factory",
    category: "Master",
    link: "/master/factories",
    require: { any: ["master.view_stockfactories"] },
  },
  {
    title: "Surveyor Selling",
    icon: "i-lucide-user-check",
    category: "Master",
    link: "/master/surveyor",
    require: { any: ["master.view_sellingsurveyor"] },
  },
]