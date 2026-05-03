<!-- components/OreGradeAccordion.vue -->
<template>
  <Accordion type="single" collapsible class="overflow-visible px-1">
    <AccordionItem value="grade">
      <AccordionTrigger>Please click to display Grade</AccordionTrigger>
      <AccordionContent>
        <div class="flex flex-col gap-0">
          <div class="grid gap-0 md:grid-cols-1">
            <div class="w-full overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="text-gray-600 dark:text-gray-300">
                  <tr>
                    <th class="text-left text-xs">Total</th>
                    <th class="text-left py-2 px-3 text-xs">ni</th>
                    <th class="text-left py-2 px-3 text-xs">co</th>
                    <th class="text-left py-2 px-3 text-xs">al2o3</th>
                    <th class="text-left py-2 px-3 text-xs">cr2o3</th>
                    <th class="text-left py-2 px-3 text-xs">fe</th>
                    <th class="text-left py-2 px-3 text-xs">mgo</th>
                    <th class="text-left py-2 px-3 text-xs">sio2</th>
                    <th class="text-left py-2 px-3 text-xs">sm</th>
                    <th class="text-left py-2 px-3 text-xs">class</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-t border-gray-200 dark:border-gray-700">
                    <td class="text-left">{{ grade?.total_ore ?? '-' }}</td>
                    <td class="py-2 px-3">{{ grade?.ni ?? '-' }}</td>
                    <td class="py-2 px-3">{{ grade?.co ?? '-' }}</td>
                    <td class="py-2 px-3">{{ grade?.al2o3 ?? '-' }}</td>
                    <td class="py-2 px-3">{{ grade?.cr2o3 ?? '-' }}</td>
                    <td class="py-2 px-3">{{ grade?.fe ?? '-' }}</td>
                    <td class="py-2 px-3">{{ grade?.mgo ?? '-' }}</td>
                    <td class="py-2 px-3">{{ grade?.sio2 ?? '-' }}</td>
                    <td class="py-2 px-3">{{ grade?.sm ?? '-' }}</td>
                    <td class="py-2 px-3">{{ grade?.grade ?? '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</template>

<script setup lang="ts">
defineProps<{
  grade: {
    total_ore?: number
    ni?: number
    co?: number
    al2o3?: number
    cr2o3?: number
    fe?: number
    mgo?: number
    sio2?: number
    sm?: number
    grade?: string
  } | null
}>()
</script>
