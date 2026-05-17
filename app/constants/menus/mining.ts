import type { NavMenu } from "~/types/nav"

export const menusMining: NavMenu[] = [
  {
    heading: 'Mining',
    require: {
      any: [
        "mining.view_mineproductions",
        "mining.view_planproductions",
        "mining.view_weather",
        "mining.view_rainfall",
        "mining.view_rainfallpoint",
        "mining.view_hmunit",
        "mining.view_fuelconsumption",
        "mining.view_unitactivity",
        "mining.view_mineadditionfactor",
      ],
    },
    items: [
      {
        title: 'Productions',
        icon: 'i-lucide-folder-input',
        require: {
          any: [
            "mining.view_mineproductions",
            "mining.view_planproductions",
          ],
        },
        children: [
          {
            title: 'Data List',
            icon: 'i-lucide-circle',
            link: '/mining/productions/',
            require: {
              any: ["mining.view_mineproductions"]
            },
          },
          {
            title: 'Data Planing',
            icon: 'i-lucide-circle',
            link: '/mining/plan',
            require: {
              any: ["mining.view_planproductions"]
            },
          },
          // {
          //   title: 'Reconcile',
          //   icon: 'i-lucide-circle',
          //   link: '/mining/reconcile',
          //   require: {
          //     any: ["mining.view_mineproductions"]
          //   },
          // },
        ],
      },

      {
        title: 'Weather',
        icon: 'i-lucide-cloud-sun-rain',
        require: {
          any: [
            "mining.view_weather",
            "mining.view_rainfall",
            "mining.view_rainfallpoint"
          ],
        },
        children: [
          {
            title: 'Daily Weather',
            icon: 'i-lucide-circle',
            link: '/mining/weather/',
            require: {
              any: ["mining.view_weather"]
            },
          },
          {
            title: 'Daily Rainfall',
            icon: 'i-lucide-circle',
            link: '/mining/rainfall',
            require: {
              any: ["mining.view_rainfall"]
            },
          },
          {
            title: 'Rainfall points',
            icon: 'i-lucide-circle',
            link: '/mining/rainfall/points',
            require: {
              any: ["mining.view_rainfallpoint"],
            },
          },
        ],
      },
      {
        title: 'Activity unit',
        icon: 'i-lucide-folder-clock',
        require: {
          any: ["mining.view_hmunit"],
        },
        children: [
          {
            title: 'Data Activity',
            icon: 'i-lucide-circle',
            link: '/mining/unit-activity',
            require: {
              any: ["mining.view_hmunit"],
            },
          },
          {
            title: 'Monitoring EWH',
            icon: 'i-lucide-circle',
            link: '/mining/unit-activity/monitoring',
             require: {
              any: ["mining.view_hmunit"],
            },
          },
        ],
      },
      {
        title: 'Fuel consumption',
        icon: 'i-lucide-fuel',
        link: '/mining/fuel',
        require: {
          any: ["mining.view_fuelconsumption"],
        },
      },

      {
        title: 'Configurations',
        icon: 'i-lucide-settings',
        require: {
          any: [
            "mining.view_unitactivity",
            "mining.view_mineadditionfactor",
          ],
        },
        children: [
          {
            title: 'Fill factors',
            icon: 'i-lucide-circle',
            link: '/mining/fill-factors',
            require: {
              any: ["mining.view_mineadditionfactor"]
            },
          },
        ],
      },
    ],
  },
]