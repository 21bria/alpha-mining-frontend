<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import 'leaflet/dist/leaflet.css'
import { useApi } from '@/composables/useApi'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from '@/components/ui/select'

const { request } = useApi()

function cleanQuery(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}

async function getApi<T = any>(url: string, extraQuery?: Record<string, any>) {
  return await request<T>(url, {
    method: 'GET',
    query: cleanQuery({
      ...extraQuery
    })
  })
}

type LookupOption = {
  value: number
  label: string
}

type ProductionMaterial = {
  material: string
  tonnage: number
}

type ProductionSummary = {
  total: number
  materials: ProductionMaterial[]
}

type SourceFeatureProperties = {
  id?: number
  sources_area?: string
  pit?: string
  luas_ha?: number | string
  status?: string
  productions?: ProductionSummary
}

type GisResponse = {
  error?: string
  iup?: GeoJSON.Feature
  sources?: GeoJSON.FeatureCollection
}

const props = defineProps<{
  role?: string
}>()

const showIup = computed(() => props.role !== 'SITE_USER')

const BASEMAPS = [
  { label: 'Standard', value: 'standard' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Outdoors', value: 'outdoor' },
  { label: 'OSM', value: 'osm' },
  { label: 'Satellite', value: 'satellite' }
] as const

type BasemapType = typeof BASEMAPS[number]['value']

const basemapFilter = ref<BasemapType>('light')
const iupList = ref<LookupOption[]>([])
const iupFilter = ref<number | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')
const hasLoadedMapData = ref(false)

const SOURCE_COLORS = [
  '#22c55e',
  '#3b82f6',
  '#f97316',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
  '#eab308',
  '#ef4444'
]

// Leaflet runtime refs
let L: any = null
let map: any = null
let currentBaseLayer: any = null
let iupLayer: any = null
let sourceLayer: any = null

function getBaseLayers() {
  if (!L) return null

  return {
    standard: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
    light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'),
    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'),
    outdoor: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'),
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
    satellite: L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '© Esri, Maxar, Earthstar Geographics'
      }
    )
  }
}

function switchBasemap(type: BasemapType) {
  if (!map || !L) return

  const layers = getBaseLayers()
  if (!layers) return

  if (currentBaseLayer) {
    map.removeLayer(currentBaseLayer)
  }

  currentBaseLayer = layers[type]
  currentBaseLayer.addTo(map)
}

function clearMapLayers() {
  if (map && iupLayer) {
    map.removeLayer(iupLayer)
    iupLayer = null
  }

  if (map && sourceLayer) {
    map.removeLayer(sourceLayer)
    sourceLayer = null
  }
}

function initMap() {
  if (!import.meta.client || !L) return

  const el = document.getElementById('map')
  if (!el) return

  if (map) {
    map.remove()
    map = null
  }

  map = L.map(el, {
    zoomControl: true
  })

  switchBasemap(basemapFilter.value)
  map.setView([-0.07, 129.41], 12)
}

function getSourceColor(sourceId: number) {
  return SOURCE_COLORS[Math.abs(sourceId) % SOURCE_COLORS.length]
}

function sourceStyle(feature?: GeoJSON.Feature) {
  const properties = (feature?.properties ?? {}) as SourceFeatureProperties

  return {
    color: getSourceColor(Number(properties.id || 0)),
    weight: 2,
    fillOpacity: 0.45,
    dashArray: '3'
  }
}

function formatNumber(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString()
}

function buildProductionPopup(properties: SourceFeatureProperties) {
  const productions = properties.productions ?? { total: 0, materials: [] }
  const materials = productions.materials ?? []
  const totalTonnage = productions.total ?? 0

  let productionHtml = '<i>No production</i>'

  if (materials.length > 0) {
    productionHtml = `
      <table style="width:100%; font-size:12px; margin-top:6px; border-collapse:collapse;">
        <thead>
          <tr>
            <th align="left">Material</th>
            <th align="right">Tonnage</th>
          </tr>
        </thead>
        <tbody>
          ${materials.map((prod) => `
            <tr>
              <td>${prod.material ?? '-'}</td>
              <td align="right">${formatNumber(prod.tonnage)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="font-weight:bold; border-top:1px solid #ccc">
            <td>Total</td>
            <td align="right">${formatNumber(totalTonnage)}</td>
          </tr>
        </tfoot>
      </table>
    `
  }

  return `
    <div style="min-width:240px">
      <div><b>Source:</b> ${properties.sources_area || '-'}</div>
      <div><b>PIT:</b> ${properties.pit || '-'}</div>
      <div><b>Area:</b> ${properties.luas_ha ?? '-'} ha</div>
      <div><b>Status:</b> ${properties.status || '-'}</div>
      <hr style="margin:6px 0"/>
      <div><b>Production:</b></div>
      ${productionHtml}
    </div>
  `
}

async function loadIUPList() {
  try {
    errorMessage.value = ''

    const res = await getApi<{ results?: any[] }>('/api/master/lookups/mine-iup/', {
      search: '',
      page: 1,
      page_size: 100
    })

    const rows = Array.isArray(res?.results) ? res.results : []

    iupList.value = rows
      .map((item: any) => ({
        value: Number(item.value ?? item.id),
        label: item.label ?? item.iup_name ?? item.iup_code ?? item.text ?? '-'
      }))
      .filter((item: LookupOption) => Number.isFinite(item.value))

    if (!iupFilter.value && iupList.value.length > 0) {
      const [first] = iupList.value
      if (first) {
        iupFilter.value = first.value
      }
    }
  } catch (err) {
    console.error('Gagal load IUP list', err)
    iupList.value = []
    errorMessage.value = 'Gagal memuat daftar IUP.'
  }
}

function fitMapToAvailableLayers() {
  if (!map) return

  if (sourceLayer && sourceLayer.getBounds?.().isValid?.()) {
    map.fitBounds(sourceLayer.getBounds(), { padding: [30, 30] })
    return
  }

  if (iupLayer && iupLayer.getBounds?.().isValid?.()) {
    map.fitBounds(iupLayer.getBounds(), { padding: [30, 30] })
  }
}

async function loadIUP(iupId: number) {
  if (!map || !L || !iupId) return

  isLoading.value = true
  errorMessage.value = ''
  hasLoadedMapData.value = false

  try {
    const data = await getApi<GisResponse>(`/api/analytics/raw/gis/mine-iup/${iupId}/`)

    clearMapLayers()

    if (!data || data.error) {
      errorMessage.value = data?.error || 'Data GIS tidak tersedia.'
      return
    }

    if (data.iup?.geometry) {
      iupLayer = L.geoJSON(data.iup, {
        style: {
          color: '#16a34a',
          weight: 2,
          fillOpacity: 0.12
        }
      }).addTo(map)
    }

    if (data.sources?.features?.length) {
      sourceLayer = L.geoJSON(data.sources, {
        style: sourceStyle,
        onEachFeature(feature: GeoJSON.Feature, layer: any) {
          const properties = (feature.properties ?? {}) as SourceFeatureProperties
          layer.bindPopup(buildProductionPopup(properties))
        }
      }).addTo(map)
    }

    fitMapToAvailableLayers()

    if (!data.iup?.geometry && !data.sources?.features?.length) {
      errorMessage.value = 'Boundary IUP atau source belum tersedia.'
    } else {
      hasLoadedMapData.value = true
    }

    await nextTick()
    map.invalidateSize?.()
  } catch (err) {
    console.error('Gagal load IUP geojson', err)
    errorMessage.value = 'Gagal memuat peta IUP.'
  } finally {
    isLoading.value = false
  }
}

watch(iupFilter, async (val) => {
  if (!val || !map || !L) return
  await loadIUP(Number(val))
})

watch(basemapFilter, async (val) => {
  if (!map || !L) return
  await nextTick()
  switchBasemap(val)
  map.invalidateSize?.()
})

onMounted(async () => {
  if (!import.meta.client) return

  const leafletModule = await import('leaflet')
  L = leafletModule.default ?? leafletModule

  await nextTick()
  initMap()

  setTimeout(() => {
    map?.invalidateSize?.()
  }, 400)

  await loadIUPList()
})

onBeforeUnmount(() => {
  clearMapLayers()

  if (map) {
    map.remove()
    map = null
  }

  currentBaseLayer = null
  L = null
})
</script>

<template>
  <ClientOnly>
    <div class="w-full flex flex-col items-stretch gap-4">
      <div class="flex flex-wrap items-end justify-between gap-2">
        <div>
      
           <h2 class="text-2xl font-normal tracking-tight">
            Mine IUP - Boundary
            <span class="text-xl">✨</span>
           </h2>
          <p class="text-sm text-muted-foreground">
            Please select IUP in the right side option to display data according to geographic area.
          </p>
        </div>

        <div v-if="showIup" class="space-y-2">
          <label class="text-sm font-medium">IUP</label>

          <Select :model-value="iupFilter != null ? String(iupFilter) : ''"
            @update:model-value="(v) => (iupFilter = v ? Number(v) : null)">
            <SelectTrigger class="w-64">
              <SelectValue :placeholder="iupList.length ? 'Select IUP' : 'Loading...'" />
            </SelectTrigger>

            <SelectContent class="z-[9999]">
              <SelectGroup>
                <SelectLabel>Mine IUP</SelectLabel>
                <SelectItem v-for="o in iupList" :key="String(o.value)" :value="String(o.value)">
                  {{ o.label }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="relative">
        <div v-show="isLoading"
          class="absolute inset-0 z-[1001] bg-white/70 dark:bg-black/40 flex items-center justify-center rounded-lg">
          <div class="text-sm font-medium">Loading map...</div>
        </div>

        <div v-if="errorMessage && !isLoading"
          class="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {{ errorMessage }}
        </div>

        <div id="map" class="w-full h-[750px] rounded-lg border"></div>

        <div class="absolute bottom-3 left-3 z-[1000] bg-white dark:bg-zinc-700 rounded-md shadow flex overflow-hidden">
          <button v-for="item in BASEMAPS" :key="item.value" @click="basemapFilter = item.value as BasemapType"
            class="px-3 py-1 text-xs border-r last:border-r-0 transition" :class="basemapFilter === item.value
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'hover:bg-gray-100 dark:hover:bg-zinc-800'">
            {{ item.label }}
          </button>
        </div>

        <div v-if="hasLoadedMapData"
          class="absolute top-3 left-3 z-[1000] rounded-md bg-white/95 dark:bg-zinc-800/95 px-3 py-2 text-xs shadow">
          Boundary loaded
        </div>
      </div>
    </div>

    <template #fallback>
      <div class="w-full h-[750px] rounded-lg border flex items-center justify-center">
        Loading map...
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped>
#map {
  z-index: 0;
}
</style>