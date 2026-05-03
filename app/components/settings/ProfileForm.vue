<script setup lang="ts">
import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { toDate } from 'reka-ui/date'
import { ref } from 'vue'
import * as z from 'zod'
import { cn } from '@/lib/utils'
import { useNotify } from '@/composables/useNotify'

const open = ref(false)
const notify = useNotify()
const { request } = useApi()

type ProfileResponse = {
  username?: string
  email?: string
  full_name: string | null
  phone?: string | null
  bio: string | null
  gender?: string | null
  avatar?: string | null
  avatar_url?: string | null
  language: string | null
  timezone?: string | null
  birth_date: string | null
  address?: string | null
  detail?: string
  profile?: ProfileResponse
}

const dateValue = ref<any>(undefined)
const placeholder = ref<any>(undefined)

const languages = [
  { label: 'English', value: 'en' },
  { label: 'Indonesia', value: 'id' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Chinese', value: 'zh' },
]

const df = new DateFormatter('en-US', {
  dateStyle: 'long',
})

const profileFormSchema = toTypedSchema(
  z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters.').max(150),
    birth_date: z.string().nullable().optional(),
    bio: z.string().max(160).nullable().optional(),
    language: z.string().min(1, 'Please select a language.'),
    gender: z.string().min(1, 'Please select a gender.'),
  }),
)

const {
  handleSubmit,
  setFieldValue,
  resetForm,
  values,
  isSubmitting,
} = useForm({
  validationSchema: profileFormSchema,
  initialValues: {
    full_name: '',
    birth_date: null,
    bio: '',
    language: 'id',
    gender: '',
  },
})

function syncCalendar(value?: string | null) {
  if (!value) {
    dateValue.value = undefined
    placeholder.value = undefined
    return
  }

  try {
    const parsed = parseDate(value)
    dateValue.value = parsed
    placeholder.value = parsed
  } catch {
    dateValue.value = undefined
    placeholder.value = undefined
  }
}

async function loadProfile() {
  try {
    const res = await request<ProfileResponse>('/api/auth/profile/', {
      method: 'GET',
    })

    resetForm({
      values: {
        full_name: res.full_name || res.username || '',
        birth_date: res.birth_date || null,
        bio: res.bio || '',
        language: res.language || 'id',
        gender: res.gender || '',
      },
    })

    syncCalendar(res.birth_date)
  } catch (error: any) {
    notify.error(error?.data?.detail || 'Failed to load profile')
  }
}

const onSubmit = handleSubmit(async (formValues) => {
  try {
    const payload = {
      full_name: formValues.full_name,
      birth_date: formValues.birth_date || null,
      bio: formValues.bio || '',
      language: formValues.language || 'id',
      gender: formValues.gender || null,
    }

    const res = await request<ProfileResponse>('/api/auth/profile/', {
      method: 'PATCH',
      body: payload,
    })

    notify.success(res?.detail || 'Profile updated successfully')
    await loadProfile()
  } catch (error: any) {
    const msg =
      error?.data?.detail ||
      error?.data?.full_name?.[0] ||
      error?.data?.birth_date?.[0] ||
      error?.data?.bio?.[0] ||
      error?.data?.language?.[0] ||
      'Failed to update profile'

    notify.error(msg)
  }
})

await loadProfile()
</script>

<template>
  <div>
    <h3 class="text-lg font-medium">
      Profile
    </h3>
    <p class="text-sm text-muted-foreground">
      This is how others will see you on the site.
    </p>
  </div>

  <Separator />

  <form class="space-y-8" @submit.prevent="onSubmit">
    <FormField v-slot="{ componentField }" name="full_name">
      <FormItem>
        <FormLabel>Name</FormLabel>
        <FormControl>
          <Input type="text" placeholder="Your name" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ value }" name="birth_date">
      <FormItem class="flex flex-col">
        <FormLabel>Date of birth</FormLabel>

        <Popover>
          <PopoverTrigger as-child>
            <Button type="button" variant="outline" :class="cn(
              'w-[240px] justify-start text-left font-normal',
              !value && 'text-muted-foreground',
            )">
              <Icon name="i-radix-icons-calendar" class="mr-2 h-4 w-4 opacity-50" />
              <span>
                {{ value && dateValue ? df.format(toDate(dateValue, getLocalTimeZone())) : 'Pick a date' }}
              </span>
            </Button>
          </PopoverTrigger>

          <PopoverContent class="p-0">
            <Calendar v-model:placeholder="placeholder" v-model="dateValue" calendar-label="Date of birth" initial-focus
              :min-value="new CalendarDate(1900, 1, 1)" :max-value="today(getLocalTimeZone())" @update:model-value="(v: any) => {
                dateValue = v

                if (v) {
                  setFieldValue('birth_date', v.toString())
                } else {
                  setFieldValue('birth_date', null)
                }
              }" />
          </PopoverContent>
        </Popover>

        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="bio">
      <FormItem>
        <FormLabel>Bio</FormLabel>
        <FormControl>
          <Textarea placeholder="Tell us a little bit about yourself" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField v-slot="{ componentField }" name="gender">
      <FormItem>
        <FormLabel>Gender</FormLabel>
        <FormControl>
          <select class="flex h-10 w-[240px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            v-bind="componentField">
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField v-slot="{ value }" name="language">
      <FormItem class="flex flex-col">
        <FormLabel>Language</FormLabel>

        <Popover v-model:open="open">
          <PopoverTrigger as-child>
            <FormControl>
              <Button type="button" variant="outline" role="combobox" :aria-expanded="open" :class="cn(
                'w-[240px] justify-between',
                !value && 'text-muted-foreground',
              )">
                {{
                  value
                    ? languages.find((language) => language.value === value)?.label
                    : 'Select language...'
                }}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </FormControl>
          </PopoverTrigger>

          <PopoverContent class="w-[240px] p-0">
            <Command>
              <CommandInput placeholder="Search language..." />
              <CommandEmpty>No language found.</CommandEmpty>

              <CommandList>
                <CommandGroup>
                  <CommandItem v-for="language in languages" :key="language.value" :value="language.value" @select="() => {
                    setFieldValue('language', language.value)
                    open = false
                  }">
                    <Check :class="cn(
                      'mr-2 h-4 w-4',
                      value === language.value ? 'opacity-100' : 'opacity-0',
                    )" />
                    {{ language.label }}
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <FormMessage />
      </FormItem>
    </FormField>

    <div class="flex justify-start gap-2">
      <Button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Updating...' : 'Update profile' }}
      </Button>

      <Button type="button" variant="outline" :disabled="isSubmitting" @click="loadProfile">
        Reset
      </Button>
    </div>
  </form>
</template>