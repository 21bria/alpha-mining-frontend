<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { toast } from 'vue-sonner'
import * as z from 'zod'

const auth = useAuthStore()
const { user } = storeToRefs(auth)

await auth.fetchMe()

const accountFormSchema = toTypedSchema(
  z.object({
    username: z
      .string()
      .min(2, { message: 'Username must be at least 2 characters.' })
      .max(30, { message: 'Username must not be longer than 30 characters.' }),
    email: z
      .string()
      .email({ message: 'Invalid email address.' }),
  }),
)

const { handleSubmit, setValues, resetForm } = useForm({
  validationSchema: accountFormSchema,
  initialValues: {
    username: '',
    email: '',
  },
})

watch(
  user,
  (val) => {
    if (val) {
      setValues({
        username: val.username ?? '',
        email: val.email ?? '',
      })
    }
  },
  { immediate: true },
)

const onSubmit = handleSubmit(async (values) => {
  try {
    const { request } = useApi()

    await request('/api/auth/account/update/', {
      method: 'PATCH',
      body: {
        username: values.username,
      },
    })

    await auth.fetchMe()

    toast.success('Account updated successfully')
  } catch (error: any) {
    toast.error(error?.data?.detail || 'Failed to update account')
  }
})
</script>

<template>
  <div>
    <h3 class="text-lg font-medium">
      Account
    </h3>
    <p class="text-sm text-muted-foreground">
      Update your account information.
    </p>
  </div>

  <Separator />

  <form class="space-y-6" @submit="onSubmit">
    <FormField v-slot="{ componentField }" name="username">
      <FormItem>
        <FormLabel>Username</FormLabel>
        <FormControl>
          <Input type="text" placeholder="Username" v-bind="componentField" />
        </FormControl>
        <FormDescription>
          This username is used for your account login or identity display.
        </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="email">
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input type="email" placeholder="Email" disabled class="bg-muted cursor-not-allowed"
            v-bind="componentField" />
        </FormControl>
        <FormDescription>
          Email cannot be changed from this page.
        </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <div class="flex justify-start gap-2">
      <Button type="submit">
        Update account
      </Button>

      <Button type="button" variant="outline" @click="resetForm({
        values: {
          username: user?.username ?? '',
          email: user?.email ?? '',
        },
      })">
        Reset
      </Button>
    </div>
  </form>
</template>