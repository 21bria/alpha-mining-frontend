import type { NavMenu } from "~/types/nav"

export const menusTools: NavMenu[] = [
  {
    heading: "",
    items: [
      {
        title: "Master",
        icon: "i-lucide-panels-top-left",
        link: "/master",
        require: {
          any: [
            "master.view_mineiup",
            "master.view_sourcemines",
            "master.view_block",
            "master.view_sourceminesloading",
            "master.view_sourceminesdumping",
            "master.view_sourceminesdome",
            "master.view_material",
            "master.view_vendors",
            "master.view_unitscategories",
            "master.view_mineunits",
            "master.view_sampletype",
            "master.view_samplemethod",
            "master.view_minegeologies",
          ],
        },
      },
      {
        title: "Reports",
        icon: "i-lucide-layout-dashboard",
        link: "/report",
        // require: {
        //   any: [
        //     "geology.view_sampleduplikatmral",
        //     "geology.view_sampleduplikatroa",
        //     "geology.view_samplecrmcertified",
        //     "geology.view_samplecrmmralview",
        //     "geology.view_samplecromoaview",
        //     "geology.view_sampletypecount",

        //     // Selling / Export kalau memang belum ada permission khusus,
        //     // boleh pakai permission view data selling yang kamu punya:
        //     // "selling.view_sellingcoa",
        //     // "selling.view_sellingofficial",
        //     // "selling.view_sellinganalysis",

        //     // Management
        //     "analytics.view_bodweeklyreport",
        //   ],
        // },
      },
    ],
  },
]
