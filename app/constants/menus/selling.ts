import type { NavMenu } from "~/types/nav"

export const menusSelling: NavMenu[] = [
  {
    heading: "Selling",
    items: [
      {
        title: "Data List",
        icon: "i-lucide-scan-barcode",
        require: {
          any: [
            "selling.view_sellingbarging",
            "selling.view_sellingdirect",
            "selling.view_sellingofficial",
          ],
        },
        children: [
          {
            title: "Barging List",
            icon: "i-lucide-circle",
            link: "/selling/barging",
            require: { any: ["selling.view_sellingbarging"] },
          },
          {
            title: "Barging Plan",
            icon: "i-lucide-circle",
            link: "/selling/plan",
            require: { any: ["selling.view_sellingbarging"] },
          },
          {
            title: "Transfer Direct",
            icon: "i-lucide-circle",
            link: "/gis/mine-iup",
            require: { any: ["selling.view_sellingdirect"] },
          },
          {
            title: "Official Selling",
            icon: "i-lucide-circle",
            link: "/selling/official",
            require: { any: ["selling.view_sellingofficial"] },
          },
        ],
      },

      {
        title: "Temporary",
        icon: "i-lucide-timer-off",
        link: "/selling/temporary",
        require: {
          any: ["selling.view_sellingbargingtemporary"],
        },
      },

      {
        title: "Selling Hub",
        icon: "i-lucide-panels-top-left",
        link: "/selling",
        require: {
          any: [
            "selling.view_sellingbarging",
            "selling.view_sellingdirect",
            "selling.view_sellingofficial",
            "selling.view_blendingdetail",
            "selling.view_sellingbargingtemporary",
            "selling.view_sellingbargingadjustment",
            "selling.view_dometransfer",
            "master.view_sellingcode",
            "master.view_stockfactories",
            "master.view_bargeunits",
            "master.view_sellingsurveyor",
          ],
        },
      },
    ],
  },
]