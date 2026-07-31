<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAuthStore } from '../../stores/authStore'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Please enter your email address or phone number'),
})

type ForgotPasswordSchema = z.output<typeof forgotPasswordSchema>

const formRef = ref()
const identifier = ref('')
const isSubmitting = ref(false)

const isForgotPasswordValid = computed(() => {
  if (!identifier.value.trim()) return false
  return forgotPasswordSchema.safeParse({ identifier: identifier.value }).success
})

async function handleSubmit(event?: FormSubmitEvent<ForgotPasswordSchema>) {
  const targetIdentifier = event?.data.identifier || identifier.value

  if (!targetIdentifier) {
    toast.add({
      title: 'Reset Request Failed',
      description: 'Please enter your email address or phone number.',
      color: 'error',
    })
    return
  }

  isSubmitting.value = true

  try {
    const msg = await authStore.resendOtp({
      identifier: targetIdentifier,
      purpose: 'password_reset',
    })

    toast.add({
      title: 'OTP Code Sent',
      description: msg || 'Password reset OTP code sent successfully.',
      color: 'success',
    })

    authStore.setPendingVerification({
      identifier: targetIdentifier,
      email: targetIdentifier,
      type: 'password_reset',
    })

    setTimeout(() => {
      // Clean route without sensitive URL parameters
      router.push('/verify')
    }, 1200)
  } catch (err: unknown) {
    toast.add({
      title: 'Reset Request Failed',
      description: (err as Error).message || 'Failed to request password reset code.',
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
          <UIcon name="i-lucide-key" class="w-6 h-6" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-highlighted">
          Forgot Password
        </h1>
        <p class="text-sm text-muted">
          Enter your account email address or phone number to receive a reset code
        </p>
      </div>
    </template>

    <UForm
      ref="formRef"
      :schema="forgotPasswordSchema"
      :state="{ identifier }"
      class="space-y-4"
      @submit="handleSubmit"
    >
      <UFormField
        label="Email or Phone Number"
        name="identifier"
        required
        help="Enter your registered email address or phone number to receive an OTP code"
      >
        <UInput
          v-model="identifier"
          placeholder="pablo@example.com or +xxx..."
          icon="i-lucide-mail"
          size="lg"
          class="w-full"
          autofocus
        />
      </UFormField>

      <UButton
        :color="isForgotPasswordValid ? 'primary' : 'neutral'"
        :variant="isForgotPasswordValid ? 'solid' : 'ghost'"
        :disabled="!isForgotPasswordValid"
        :loading="isSubmitting"
        size="lg"
        block
        class="w-full justify-center text-base font-semibold py-2.5 mt-2"
        @click="formRef?.submit()"
      >
        Send Reset Code
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
