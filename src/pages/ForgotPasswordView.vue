<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const identifier = ref('')
const isSubmitting = ref(false)
const message = ref<string | null>(null)
const localError = ref<string | null>(null)

async function handleSubmit() {
  if (!identifier.value) {
    localError.value = 'Please enter your username, email, or phone.'
    return
  }

  localError.value = null
  message.value = null
  isSubmitting.value = true

  try {
    const msg = await authStore.resendOtp({
      identifier: identifier.value,
      purpose: 'password_reset',
    })
    message.value = msg || 'Password reset OTP code sent successfully.'

    authStore.setPendingVerification({
      identifier: identifier.value,
      email: identifier.value,
      type: 'password_reset',
    })

    setTimeout(() => {
      // Clean route without sensitive URL parameters
      router.push('/verify')
    }, 1200)
  } catch (err: any) {
    localError.value = err.message || 'Failed to request password reset code.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <UCard class="w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-800">
      <template #header>
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 mb-1">
            <UIcon name="i-lucide-key" class="w-6 h-6" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Forgot Password
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Enter your account email, username or phone to receive a reset code
          </p>
        </div>
      </template>

      <!-- Alert Error -->
      <UAlert
        v-if="localError || authStore.error"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :title="localError || authStore.error || ''"
        class="mb-4"
      />

      <!-- Alert Success -->
      <UAlert
        v-if="message"
        color="success"
        variant="soft"
        icon="i-lucide-check-circle-2"
        :title="message"
        class="mb-4"
      />

      <UForm class="space-y-4" @submit="handleSubmit">
        <UFormField label="Email, Username or Phone" required :error="authStore.fieldErrors.identifier">
          <UInput
            v-model="identifier"
            placeholder="pablodev"
            icon="i-lucide-user"
            size="lg"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          size="lg"
          block
          class="w-full justify-center text-base font-semibold py-2.5 mt-2"
          :loading="isSubmitting"
        >
          Send Reset Code
        </UButton>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
          Remembered your password?
          <RouterLink to="/login" class="text-primary hover:text-primary-500 font-semibold ml-1">
            Back to Sign In
          </RouterLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
