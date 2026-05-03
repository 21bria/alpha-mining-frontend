import type { NavMenu } from "~/types/nav"

export const menusReport: NavMenu[] = [

  {
    heading: 'Report',
    items: [
      {
        title: 'Sample Duplicated',
        icon: 'i-lucide-copy-check',
        require: {
          any: [
            "geology.view_sampleduplikatmral",
            "geology.view_sampleduplikatroa",
          ],
        },
        children: [
          {
            title: 'Data List',
            icon: 'i-lucide-circle',
            link: '/report/quality/sample-duplicated/data-list',
            require: {
              any: [
                "geology.view_sampleduplikatmral",
                "geology.view_sampleduplikatroa",
              ],
            },
          },
          {
            title: 'Analysis',
            icon: 'i-lucide-circle',
            new: false,
            link: '/report/quality/sample-duplicated/analysis',
            require: {
              any: [
                "geology.view_sampleduplikatmral",
                "geology.view_sampleduplikatroa",
              ],
            },
          },
          {
            title: 'Wet Samples',
            icon: 'i-lucide-circle',
            new: false,
            link: '/report/quality/sample-duplicated/wet-samples',
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
        title: 'CRM certificate',
        icon: 'i-lucide-ticket',
        new: false,
        link: '/report/quality/sample-crm/certified',
        require: {
          any: ["geology.view_samplecrmcertified"],
        },
      },
      {
        title: 'CRM analysis',
        icon: 'i-lucide-list-chevrons-up-down',
        require: {
          any: ["geology.view_samplecrmmralview", "geology.view_samplecromoaview"],
        },
        children: [
          {
            title: 'Data List',
            icon: 'i-lucide-circle',
            link: '/report/quality/sample-crm/data-list',
            require: {
              any: ["geology.view_samplecrmmralview", "geology.view_samplecromoaview"],
            },
          },
          {
            title: 'Analysis',
            icon: 'i-lucide-circle',
            new: false,
            link: '/report/quality/sample-crm/analysis',
            require: {
              any: ["geology.view_samplecrmmralview", "geology.view_samplecromoaview"],
            },
          },
        ],
      },
      {
        title: 'Laboratory (tat)',
        icon: 'i-lucide-radical',
        require: {
          any: ["geology.view_sampletypecount"]
        },
        children: [
          // {
          //   title: 'Data List',
          //   icon: 'i-lucide-circle',
          //   link: '/report/lab/data-order',
          // },
          {
            title: 'Count by Type',
            icon: 'i-lucide-circle',
            new: false,
            link: '/report/lab/count-type',
            require: {
              any: ["geology.view_sampletypecount"]
            },
          },
          {
            title: 'Analysis TAT',
            icon: 'i-lucide-circle',
            new: false,
            link: '/report/lab/analysis',
            require: {
              any: ["geology.view_sampletypecount"]
            },
          },
        ],
      },
      {
        title: 'Selling analysis',
        icon: 'i-lucide-file-chart-line',
        children: [
          {
            title: 'Data COA',
            icon: 'i-lucide-circle',
            link: '/report/selling/official',
          },
          {
            title: 'Chart Analysis',
            icon: 'i-lucide-circle',
            link: '/report/selling/analysis',
          },
          {
            title: 'Sample monitoring',
            icon: 'i-lucide-circle',
            new: false,
            link: '/report/selling/monitoring',
          },
        ],
      },
      {
        title: 'Compile data',
        icon: 'i-lucide-chart-no-axes-column',
        new: false,
        link: '/report/compile',
      },
      {
        title: 'Export data',
        icon: 'i-lucide-file-down',
        new: false,
        link: '/report/export-data',
      },
      {
        title: 'Export coa',
        icon: 'i-lucide-list-indent-increase',
        new: false,
        link: '/report/export-coa',
      },
    ],
  },

]