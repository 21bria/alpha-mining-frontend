<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import * as z from 'zod'
import { Eye, EyeOff } from 'lucide-vue-next'

const showOld = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const securityFormSchema = toTypedSchema(
  z.object({
    old_password: z.string().min(1, { message: 'Old password is required.' }),
    new_password: z.string().min(8, { message: 'Min 8 characters.' }),
    confirm_password: z.string().min(1, { message: 'Confirm required.' }),
  }).refine(data => data.new_password === data.confirm_password, {
    message: 'Confirm password does not match.',
    path: ['confirm_password'],
  }),
)

const { handleSubmit, resetForm } = useForm({
  validationSchema: securityFormSchema,
  initialValues: {
    old_password: '',
    new_password: '',
    confirm_password: '',
  },
})

const onSubmit = handleSubmit(async (values) => {
  try {
    const { request } = useApi()

    await request('/api/auth/change-password/', {
      method: 'POST',
      body: values,
    })

    toast.success('Password updated successfully')

    resetForm()
  } catch (error: any) {
    const msg =
      error?.data?.detail ||
      error?.data?.old_password?.[0] ||
      error?.data?.new_password?.[0] ||
      'Failed to update password'

    toast.error(msg)
  }
})
</script>

<template>
  <div>
    <h3 class="text-lg font-medium">Security</h3>
    <p class="text-sm text-muted-foreground">Update your password.</p>
  </div>

  <Separator />

  <form class="space-y-6" @submit="onSubmit">

    <!-- OLD PASSWORD -->
    <FormField v-slot="{ componentField }" name="old_password">
      <FormItem>
        <FormLabel>Old Password</FormLabel>
        <div class="relative">
          <FormControl>
            <Input
              :type="showOld ? 'text' : 'password'"
              v-bind="componentField"
              placeholder="Enter old password"
            />
          </FormControl>

          <button
            type="button"
            class="absolute right-2 top-2 text-muted-foreground"
            @click="showOld = !showOld"
          >
            <component :is="showOld ? EyeOff : Eye" class="w-4 h-4" />
          </button>
        </div>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- NEW PASSWORD -->
    <FormField v-slot="{ componentField }" name="new_password">
      <FormItem>
        <FormLabel>New Password</FormLabel>
        <div class="relative">
          <FormControl>
            <Input
              :type="showNew ? 'text' : 'password'"
              v-bind="componentField"
              placeholder="Enter new password"
            />
          </FormControl>

          <button
            type="button"
            class="absolute right-2 top-2 text-muted-foreground"
            @click="showNew = !showNew"
          >
            <component :is="showNew ? EyeOff : Eye" class="w-4 h-4" />
          </button>
        </div>
        <FormDescription>
          Minimum 8 characters.
        </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- CONFIRM PASSWORD -->
    <FormField v-slot="{ componentField }" name="confirm_password">
      <FormItem>
        <FormLabel>Confirm Password</FormLabel>
        <div class="relative">
          <FormControl>
            <Input
              :type="showConfirm ? 'text' : 'password'"
              v-bind="componentField"
              placeholder="Confirm new password"
            />
          </FormControl>

          <button
            type="button"
            class="absolute right-2 top-2 text-muted-foreground"
            @click="showConfirm = !showConfirm"
          >
            <component :is="showConfirm ? EyeOff : Eye" class="w-4 h-4" />
          </button>
        </div>
        <FormMessage />
      </FormItem>
    </FormField>

    <div class="flex gap-2">
      <Button type="submit">
        Update password
      </Button>

      <Button type="button" variant="outline" @click="resetForm()">
        Reset
      </Button>
    </div>
  </form>
</template>