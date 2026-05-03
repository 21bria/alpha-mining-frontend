import type { NavMenu } from "~/types/nav"

export const menusSelling: NavMenu[] = [

  {
    heading: 'Selling',
    require: {
      any: [
        "selling.view_sellingbarging",
        "selling.view_sellingdirect",
        "selling.view_sellingofficial",
        "selling.view_blendingdetail",
        "selling.view_sellingbargingtemporary",
        "master.view_sellingcode",
        "master.view_stockfactories",
        "master.view_bargeunits",
        "master.view_sellingsurveyor",
        "selling.view_sellingofficial"
      ],
    },
    items: [
      {
        title: 'Data List',
        icon: 'i-lucide-scan-barcode',
        require: {
          any: [
            "selling.view_sellingbarging",
            "selling.view_sellingdirect",
            "selling.view_sellingofficial"
          ],
        },
        children: [
          {
            title: 'Barging list',
            icon: 'i-lucide-circle',
            link: '/selling/barging',
            require: {
              any: ["selling.view_sellingbarging"]
            },
          },
          {
            title: 'Barging plan',
            icon: 'i-lucide-circle',
            link: '/selling/plan',
            require: {
              any: ["selling.view_sellingbarging"]
            },
          },
          {
            title: 'Transfer dircet',
            icon: 'i-lucide-circle',
            link: '/gis/mine-iup',
            require: {
              any: ["selling.view_sellingdirect"]
            },
          },
           {
            title: 'Official selling',
            icon: 'i-lucide-circle',
            link: '/selling/official',
            require: {
              any: ["selling.view_sellingofficial"]
            },
          },
        ],
      },
      {
        title: 'Blending form',
        icon: 'i-lucide-grid-2x2-check',
        link: '/selling/blending',
        require: {
          any: ["selling.view_blendingdetail"]
        },
      },
      {
        title: 'Temporary form',
        icon: 'i-lucide-between-horizontal-start',
        require: {
              any: [
                "selling.view_sellingbargingtemporary",
                "selling.view_sellingbargingadjustment"
              ],
            },
        children: [
          {
            title: 'Data selling',
            icon: 'i-lucide-circle',
            link: '/selling/temporary',
              require: { 
              any: ["selling.view_sellingbargingtemporary"]
            },
          },
          // {
          //   title: 'Summmary daily',
          //   icon: 'i-lucide-circle',
          //   link: '/selling/daily-summary',
          // },
          {
            title: 'Adjust selling',
            icon: 'i-lucide-circle',
            link: '/selling/code-adjust',
              require: {
              any: ["selling.view_sellingbargingadjustment"]
            },
          },
        ],
      },
      {
        title: 'Master',
        icon: 'i-lucide-database-zap',
        require: {
          any: [
            "master.view_sellingcode",
            "master.view_stockfactories",
            "master.view_bargeunits",
            "master.view_sellingsurveyor",
          ],
        },
        children: [
          {
            title: 'Code Selling',
            icon: 'i-lucide-circle',
            link: '/master/selling-code',
            require: {
              any: ["master.view_sellingcode"],
            },
          },
          {
            title: 'Barge Selling',
            icon: 'i-lucide-circle',
            link: '/master/barge',
            require: {
              any: ["master.view_bargeunits"]
            },
          },
          {
            title: 'Factory Selling',
            icon: 'i-lucide-circle',
            link: '/master/factories',
            require: {
              any: ["master.view_stockfactories"]
            },
          },
          {
            title: 'Surveyor Selling',
            icon: 'i-lucide-circle',
            link: '/master/surveyor',
            require: {
              any: ["master.view_sellingsurveyor"]
            },
          },
         
        ],
      },
    ],
  },
]