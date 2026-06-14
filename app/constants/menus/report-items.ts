import type { NavLink, NavGroup } from "~/types/nav"

export type ReportCategory =
  | "Quality"
  | "Laboratory"
  | "Selling"
  | "Export"
  | "Management"

export type ReportItem =
  | (NavLink & { category?: ReportCategory })
  | (NavGroup & { category?: ReportCategory })

export const reportItems: ReportItem[] = [
  {
    title: "Sample Duplicated",
    icon: "i-lucide-copy-check",
    category: "Quality",
    require: {
      any: [
        "geology.view_sampleduplikatmral",
        "geology.view_sampleduplikatroa",
      ],
    },
    children: [
      {
        title: "Data List",
        icon: "i-lucide-circle",
        link: "/report/quality/sample-duplicated/data-list",
        require: {
          any: [
            "geology.view_sampleduplikatmral",
            "geology.view_sampleduplikatroa",
          ],
        },
      },
      {
        title: "Analysis",
        icon: "i-lucide-circle",
        new: false,
        link: "/report/quality/sample-duplicated/analysis",
        require: {
          any: [
            "geology.view_sampleduplikatmral",
            "geology.view_sampleduplikatroa",
          ],
        },
      },
      {
        title: "Wet Samples",
        icon: "i-lucide-circle",
        new: false,
        link: "/report/quality/sample-duplicated/wet-samples",
        require: {
          any: [
            "geology.view_sampleduplikatmral",
            "geology.view_sampleduplikatroa",
          ],
        },
      },
    ],
  },

  {
    title: "CRM analysis",
    icon: "i-lucide-list-chevrons-up-down",
    category: "Quality",
    require: {
      any: ["geology.view_samplecrmcertified,geology.view_samplecrmmralview", "geology.view_samplecromoaview"],
    },
    children: [
      {
        title: "CRM certificate",
        icon: "i-lucide-circle",
        link: "/report/quality/sample-crm/certified",
        require: {
          any: ["geology.view_samplecrmcertified"],
        },
      },
      {
        title: "Data List",
        icon: "i-lucide-circle",
        link: "/report/quality/sample-crm/data-list",
        require: {
          any: ["geology.view_samplecrmmralview", "geology.view_samplecromoaview"],
        },
      },
      {
        title: "Analysis",
        icon: "i-lucide-circle",
        new: false,
        link: "/report/quality/sample-crm/analysis",
        require: {
          any: ["geology.view_samplecrmmralview", "geology.view_samplecromoaview"],
        },
      },
    ],
    
  },
 
  {
    title: "Dome sample",
    icon: "i-lucide-ticket",
    category: "Quality",
    new: true,
    link: "/report/quality/samples/dome",
    require: {
      any: ["geology.view_samplesdomeview"],
    },
  },
  {
      title: "Reconciliation PSI",
      icon: "i-lucide-git-compare-arrows",
      category: "Quality",
      // require: {
      //   any: ["geology.view_samplecrmcertified,geology.view_samplecrmmralview", "geology.view_samplecromoaview"],
      // },
      children: [
        {
          title: "Sample PSI",
          icon: "i-lucide-circle",
          link: "/report/quality/sample-psi/data-list",
          // require: {
          //   any: ["geology.view_samplecrmmralview", "geology.view_samplecromoaview"],
          // },
        },
        {
          title: "Inventory PSI",
          icon: "i-lucide-circle",
          new: false,
          link: "/report/quality/sample-psi/inventory",
          // require: {
          //   any: ["geology.view_samplecrmmralview", "geology.view_samplecromoaview"],
          // },
        },
      ],
    
  },
 
  {
    title: "Laboratory (TAT)",
    icon: "i-lucide-radical",
    category: "Laboratory",
    require: {
      any: ["geology.view_sampletypecount"],
    },
    children: [
      {
        title: "Count by Type",
        icon: "i-lucide-circle",
        new: false,
        link: "/report/lab/count-type",
        require: {
          any: ["geology.view_sampletypecount"],
        },
      },
      {
        title: "Analysis TAT",
        icon: "i-lucide-circle",
        new: false,
        link: "/report/lab/analysis",
        require: {
          any: ["geology.view_sampletypecount"],
        },
      },
    ],
  },
  {
    title: "Selling analysis",
    icon: "i-lucide-file-chart-line",
    category: "Selling",
    // require: {
    //   any: [
    //     "selling.view_sellingofficial",
    //     "selling.view_sellinganalysis",
    //     "selling.view_sellingmonitoring",
    //   ],
    // },
    children: [
      {
        title: "Data COA",
        icon: "i-lucide-circle",
        link: "/report/selling/official",
        // require: { any: ["selling.view_sellingofficial"] },
      },
      {
        title: "Chart Analysis",
        icon: "i-lucide-circle",
        link: "/report/selling/analysis",
        // require: { any: ["selling.view_sellinganalysis"] },
      },
      {
        title: "Sample monitoring",
        icon: "i-lucide-circle",
        new: false,
        link: "/report/selling/monitoring",
        // require: { any: ["selling.view_sellingmonitoring"] },
      },
    ],
  },
 
  {
    title: "Compile data",
    icon: "i-lucide-chart-no-axes-column",
    category: "Export",
    new: false,
    link: "/report/compile",
    require: {
      any: [
        "geology.view_sampleduplikatmral",
        "geology.view_sampleduplikatroa",
        "geology.view_samplecrmcertified",
        "geology.view_samplecrmmralview",
        "geology.view_samplecromoaview",
        "geology.view_sampletypecount",
      ],
    },
  },
  {
    title: "Export data",
    icon: "i-lucide-file-down",
    category: "Export",
    new: false,
    link: "/report/export-data",
    // require: {
    //   any: [
    //     "geology.view_sampleduplikatmral",
    //     "geology.view_sampleduplikatroa",
    //     "geology.view_samplecrmcertified",
    //     "geology.view_samplecrmmralview",
    //     "geology.view_samplecromoaview",
    //     "geology.view_sampletypecount",
    //   ],
    // },
  },
  {
    title: "Export COA",
    icon: "i-lucide-list-indent-increase",
    category: "Export",
    new: false,
    link: "/report/export-coa",
    // require: {
    //   any: ["selling.view_sellingofficial"],
    // },
  },
  {
    title: "Report Management",
    icon: "i-lucide-activity",
    category: "Management",
    new: true,
    link: "/report/management",
    require: {
      any: ["analytics.view_reportmanagement"],
    },
  },
]