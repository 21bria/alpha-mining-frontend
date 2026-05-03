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
        "geology.view_domemerget",
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
        icon: 'i-lucide-map',
        require: { any: ["geology.view_sampleproductions"] },
        children: [
          {
            title: 'Samples Data',
            icon: 'i-lucide-circle',
            link: '/geology/samples',
            require: { any: ["geology.view_sampleproductions"] },
          },
          // {
          //   title: 'Samples Error',
          //   icon: 'i-lucide-circle',
          //   link: '/geology/error',
          //   require: { any: ["geology.view_sampleproductions"] },
          // },
          // {
          //   title: 'Samples to Lab',
          //   icon: 'i-lucide-circle',
          //   link: '/geolgy/pending-lab',
          //   require: { any: ["geology.view_sampleproductions"] },
          // },
        ],
      },
      {
        title: 'Waybills',
        icon: 'i-lucide-clipboard-clock',
        require: { any: ["geology.view_waybills"] },
        children: [
          {
            title: 'Data List',
            icon: 'i-lucide-circle',
            link: '/geology/waybills',
            require: { any: ["geology.view_waybills"] },
          },
          // {
          //   title: 'Data Over',
          //   icon: 'i-lucide-circle',
          //   link: '/geology/waybills/over',
          //   require: { any: ["geology.view_waybills"] },
          // },

        ],
      },
      {
        title: 'Productions',
        icon: 'i-lucide-share-2',
        require: { any: ["geology.view_oreproductions"] },
        children: [
          {
            title: 'Data List',
            icon: 'i-lucide-circle',
            link: '/geology/productions',
            require: { any: ["geology.view_oreproductions"] },
          },
       
          // {
          //   title: 'Status batch',
          //   icon: 'i-lucide-circle',
          //   link: '/geology/productions/batch',
          //   require: { any: ["geology.view_oreproductions"] },
          // },
        ],
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
        title: 'Configurations',
        icon: 'i-lucide-settings',
        require: {
          any: [
            "master.view_oreclass",
            "master.view_oretruckfactor",
            "geology.view_oreadjustment",
            "geology.view_domeadjustment",
            "geology.view_domemerget",
            "geology.view_stockpilemerge",
            "geology.view_domestatusclose",
            "geology.view_domestatusfinish",
          ],
        },
        children: [
          {
            title: 'Ore Class',
            icon: 'i-lucide-circle',
            link: '/master/ore-class',
            require: { any: ["master.view_oreclass"] }
          },
          {
            title: 'Fill factors',
            icon: 'i-lucide-circle',
            link: '/master/fill-factors',
            require: { any: ["master.view_oretruckfactor"] }
          },
          {
            title: 'Ore adjust',
            icon: 'i-lucide-circle',
            link: '/geology/ore-adjust',
            require: { any: ["geology.view_oreadjustment"] },
          },
          {
            title: 'Dome adjust',
            icon: 'i-lucide-circle',
            link: '/geology/dome-adjust',
            require: { any: ["geology.view_domeadjustment"] },
          },
          {
            title: 'Dome status',
            icon: 'i-lucide-circle',
            link: '/geology/dome-status',
            require: { any: ["geology.view_domestatusclose"] },
          },
   
          {
            title: 'Merge dome',
            icon: 'i-lucide-circle',
            link: '/geology/dome/merge',
            require: { any: ["geology.view_domemerget"] },
          },
          {
            title: 'Compositing',
            icon: 'i-lucide-circle',
            link: '/geology/compositing',
            require: { any: ["geology.view_stockpilemerge"] },
          },
        ],
      },
    ],
  },

]