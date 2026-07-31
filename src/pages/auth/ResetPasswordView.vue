<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAuthStore } from '../../stores/authStore'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()

// Read authorization details from store or route fallback
const identifier = computed(() => {
  return (
    authStore.pendingVerification?.identifier ||
    authStore.pendingVerification?.email ||
    (route.query.identifier as string) ||
    authStore.lastRegisteredIdentifier ||
    ''
  )
})

const code = computed(() => {
  return authStore.pendingVerification?.code || (route.query.code as string) || ''
})

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters long'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetPasswordSchema = z.output<typeof resetPasswordSchema>

const formRef = ref()

const formState = reactive<Partial<ResetPasswordSchema>>({
  newPassword: '',
  confirmPassword: '',
})

const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const isSubmitting = ref(false)

const isResetPasswordValid = computed(() => {
  if (!formState.newPassword || !formState.confirmPassword) return false
  return resetPasswordSchema.safeParse(formState).success
})

async function handleResetPassword(event?: FormSubmitEvent<ResetPasswordSchema>) {
  const newPassword = event?.data.newPassword || formState.newPassword

  if (!newPassword) {
    toast.add({
      title: 'Password Reset Failed',
      description: 'Please enter a new password.',
      color: 'error',
    })
    return
  }

  if (newPassword.length < 8) {
    toast.add({
      title: 'Password Reset Failed',
      description: 'Password must be at least 8 characters long.',
      color: 'error',
    })
    return
  }

  if (!identifier.value || !code.value) {
    toast.add({
      title: 'Password Reset Failed',
      description: 'Missing password reset authorization code. Please request a new reset code.',
      color: 'error',
    })
    return
  }

  isSubmitting.value = true

  try {
    const msg = await authStore.resetPassword({
      identifier: identifier.value,
      code: code.value,
      newPassword,
    })

    toast.add({
      title: 'Password Updated',
      description: msg || 'Password updated successfully!',
      color: 'success',
    })

    setTimeout(() => {
      router.push('/login')
    }, 1200)
  } catch (err: unknown) {
    toast.add({
      title: 'Password Reset Failed',
      description: (err as Error).message || 'Failed to reset password. The reset code may have expired.',
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-md shadow-xl border border-default">
    <template #header>
      <div class="text-center space-y-2">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-1"
        >
          <UIcon name="i-lucide-key-round" class="w-6 h-6" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-highlighted">
          Set New Password
        </h1>
        <p class="text-sm text-muted">
          Choose a new secure password for your account
        </p>
      </div>
    </template>

    <!-- Form with Zod Validation -->
    <UForm
      ref="formRef"
      :schema="resetPasswordSchema"
      :state="formState"
      class="space-y-4"
      @submit="handleResetPassword"
    >
      <UFormField
        label="New Password"
        name="newPassword"
        required
        help="Must be at least 8 characters long"
      >
        <UInput
          v-model="formState.newPassword"
          :type="showNewPassword ? 'text' : 'password'"
          placeholder="••••••••"
          icon="i-lucide-lock"
          size="lg"
          class="w-full"
          autofocus
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="xs"
              :icon="showNewPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              aria-label="Toggle password visibility"
              class="p-0.5 text-dimmed hover:text-highlighted pointer-events-auto"
              @click="showNewPassword = !showNewPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <UFormField
        label="Confirm New Password"
        name="confirmPassword"
        required
        help="Re-enter your new password to confirm"
      >
        <UInput
          v-model="formState.confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          placeholder="••••••••"
          icon="i-lucide-lock"
          size="lg"
          class="w-full"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="xs"
              :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              aria-label="Toggle password visibility"
              class="p-0.5 text-dimmed hover:text-highlighted pointer-events-auto"
              @click="showConfirmPassword = !showConfirmPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <UButton
        :color="isResetPasswordValid ? 'primary' : 'neutral'"
        :variant="isResetPasswordValid ? 'solid' : 'ghost'"
        :disabled="!isResetPasswordValid"
        :loading="isSubmitting"
        size="lg"
        block
        class="w-full justify-center text-base font-semibold py-2.5 mt-2"
        @click="formRef?.submit()"
      >
        Update Password
      </UButton>
    </UForm>

    <template #footer>
      <p class="text-center text-sm text-muted">
        Remembered your password?
        <RouterLink to="/login" class="text-primary font-semibold hover:underline ml-1">
          Back to Sign In
        </RouterLink>
      </p>
    </template>
  </UCard>
</template>
