// ~/constants/menus/master.ts
import type { NavMenu } from "~/types/nav"

export const menusMaster: NavMenu[] = [
  {
    heading: "Master",
    require: {
      any: [
        "master.view_mineiup",
        "master.view_minesource",
        "master.view_block",
        "master.view_sourceminesloading",
        "master.view_sourceminesdumping",
        "master.view_sourceminesdome",
        "master.view_material",
        "master.view_vendors",
        "master.view_unitscategories",
        "master.view_mineunits",
        "master.view_bargeport",
        "master.view_sampletype",
        "master.view_samplemethod",
        "master.view_minegeologies",
      ],
    },
    items: [
      {
        title: "Sources",
        icon: "i-lucide-map-pin-house",
        require: {
          any: [
            "master.view_mineiup",
            "master.view_sourcemines",
            "master.view_block",
            "master.view_sourceminesloading",
            "master.view_sourceminesdumping",
            "master.view_sourceminesdome",
          ],
        },
        children: [
          {
            title: "Data IUP",
            icon: "i-lucide-circle",
            link: "/master/sources",
            require: { any: ["master.view_mineiup"] },
          },
          {
            title: "Sources",
            icon: "i-lucide-circle",
            link: "/master/sources/mine-source",
            require: { any: ["master.view_sourcemines"] },
          },
          {
            title: "Blocks",
            icon: "i-lucide-circle",
            link: "/master/sources/mine-block",
            require: { any: ["master.view_block"] },
          },
          {
            title: "Loading Points",
            icon: "i-lucide-circle",
            link: "/master/sources/mine-loading",
            require: { any: ["master.view_sourceminesloading"] },
          },
          {
            title: "Dumping Points",
            icon: "i-lucide-circle",
            link: "/master/sources/mine-dumping",
            require: { any: ["master.view_sourceminesdumping"] },
          },
          {
            title: "Dome Points",
            icon: "i-lucide-circle",
            link: "/master/sources/mine-dome",
            require: { any: ["master.view_sourceminesdome"] },
          },
        ],
      },

      {
        title: "Materials",
        icon: "i-lucide-circle-pile",
        link: "/master/materials",
        require: { any: ["master.view_material"] },
      },
      {
        title: "Vendors",
        icon: "i-lucide-columns-3-cog",
        link: "/master/vendors",
        require: { any: ["master.view_vendors"] },
      },

      {
        title: "Mine Units",
        icon: "i-lucide-tram-front",
        link: "/master/units",
        require: { any: ["master.view_unitscategories", "master.view_mineunits"] },
      },
      {
        title: "Mine Activity",
        icon: "i-lucide-split",
        link: "/master/activity",
        require: { any: ["master.view_unitscategories", "master.view_locations"] },
      },
      {
        title: "Sample Type",
        icon: "i-lucide-scan-text",
        link: "/master/sample/type",
        require: {
          any: [
            "master.view_sampletype",
            "master.view_samplemethod",
          ]
        },
      },
      {
        title: "Grade Control",
        icon: "i-lucide-users-round",
        link: "/master/grade-control",
        require: { any: ["master.view_minegeologies"] },
      },
    ],
  },
]