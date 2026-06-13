import type { NavMenu } from "~/types/nav"

export const menusGeology: NavMenu[] = [
  {
    heading: 'Geolgy',
    require: {
      any: [
        "geology.view_assaymral",
        "geology.view_assayroa",
        "geology.view_minesource",
        "geology.view_sampleproductions",
        "geology.view_waybills",
        "geology.view_oreproductions",
        "geology.view_oreadjustment",
        "geology.view_domeadjustment",
        "geology.view_domemerge",
        "geology.view_stockpilemerge",
        "geology.view_domestatusclose",
        "geology.view_domestatusfinish",
        "master.view_oreclass",
        "master.view_oretruckfactor",
      ],
    },
    items: [
      {
        title: 'Samples',
        icon: 'i-lucide-pickaxe',
        link: '/geology/samples',
        require: { any: ["geology.view_sampleproductions"] },
      },
      {
        title: 'Waybills',
        icon: 'i-lucide-clipboard-clock',
        link: '/geology/waybills',
        require: { any: ["geology.view_waybills"] },
      },
      {
        title: 'Productions',
        icon: 'i-lucide-database-zap',
        link: '/geology/productions',
        require: { any: ["geology.view_oreproductions"] },
      },

      {
        title: 'Data Assay',
        icon: 'i-lucide-decimals-arrow-right',
        require: {
          any: [
            "geology.view_assaymral",
            "geology.view_assayroa",
          ],
        },
        children: [
          {
            title: 'Data mral',
            icon: 'i-lucide-circle',
            link: '/geology/assay/mral',
            require: { any: ["geology.view_assaymral"] },
          },
          {
            title: 'Data roa',
            icon: 'i-lucide-circle',
            link: '/geology/assay/roa',
            require: { any: ["geology.view_assayroa"] }
          },

        ],
      },
      {
        title: "Settings",
        icon: "i-lucide-settings",
        link: "/geology/configurations",
        require: {
          any: [
            "master.view_oreclass",
            "master.view_oretruckfactor",
            "geology.view_oreadjustment",
            "geology.view_domeadjustment",
            "geology.view_domestatusclose",
            "geology.view_domemerge",
          ],
        },
      },
    ],
  },

]