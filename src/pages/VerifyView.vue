<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const identifier = ref((route.query.identifier as string) || authStore.lastRegisteredIdentifier || '')
const code = ref('')
const verifyType = ref<'email_verification' | 'phone_verification' | 'password_reset'>(
  (route.query.type as any) || 'email_verification'
)

const isSubmitting = ref(false)
const isResending = ref(false)
const message = ref<string | null>(null)
const localError = ref<string | null>(null)

async function handleVerify() {
  if (!identifier.value || !code.value) {
    localError.value = 'Please enter both your identifier and 4-digit verification code.'
    return
  }

  localError.value = null
  message.value = null
  isSubmitting.value = true

  try {
    const msg = await authStore.verifyCode({
      identifier: identifier.value,
      code: code.value,
      type: verifyType.value,
    })

    message.value = msg || 'Verification successful!'

    setTimeout(() => {
      if (verifyType.value === 'password_reset') {
        router.push({
          path: '/reset-password',
          query: { identifier: identifier.value, code: code.value },
        })
      } else {
        router.push('/login')
      }
    }, 1200)
  } catch (err: any) {
    localError.value = err.message || 'Verification failed.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleResend() {
  if (!identifier.value) {
    localError.value = 'Please enter your identifier to resend code.'
    return
  }

  localError.value = null
  message.value = null
  isResending.value = true

  try {
    const msg = await authStore.resendOtp({
      identifier: identifier.value,
      purpose: verifyType.value,
    })
    message.value = msg || 'A new verification code has been sent.'
  } catch (err: any) {
    localError.value = err.message || 'Failed to resend verification code.'
  } finally {
    isResending.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <UCard class="w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-800">
      <template #header>
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 mb-1">
            <UIcon name="i-lucide-shield-alert" class="w-6 h-6" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Security Verification
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Enter the 4-digit code sent to your email or phone
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

      <!-- Success Alert -->
      <UAlert
        v-if="message"
        color="success"
        variant="soft"
        icon="i-lucide-check-circle-2"
        :title="message"
        class="mb-4"
      />

      <UForm class="space-y-4" @submit="handleVerify">
        <UFormField label="Username, Email or Phone" required>
          <UInput
            v-model="identifier"
            placeholder="pablodev"
            icon="i-lucide-user"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Verification Type" required>
          <div class="grid grid-cols-3 gap-2">
            <UButton
              type="button"
              size="xs"
              :color="verifyType === 'email_verification' ? 'primary' : 'neutral'"
              :variant="verifyType === 'email_verification' ? 'solid' : 'outline'"
              @click="verifyType = 'email_verification'"
            >
              Email
            </UButton>
            <UButton
              type="button"
              size="xs"
              :color="verifyType === 'phone_verification' ? 'primary' : 'neutral'"
              :variant="verifyType === 'phone_verification' ? 'solid' : 'outline'"
              @click="verifyType = 'phone_verification'"
            >
              Phone
            </UButton>
            <UButton
              type="button"
              size="xs"
              :color="verifyType === 'password_reset' ? 'primary' : 'neutral'"
              :variant="verifyType === 'password_reset' ? 'solid' : 'outline'"
              @click="verifyType = 'password_reset'"
            >
              Reset
            </UButton>
          </div>
        </UFormField>

        <UFormField label="4-Digit Security Code" required help="Enter 4-digit code e.g. 1234">
          <UInput
            v-model="code"
            placeholder="1234"
            icon="i-lucide-hash"
            size="lg"
            maxlength="4"
            class="w-full text-center font-mono tracking-widest text-xl"
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
          Verify Code
        </UButton>
      </UForm>

      <template #footer>
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500 dark:text-gray-400">Didn't receive code?</span>
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            :loading="isResending"
            @click="handleResend"
          >
            Resend OTP
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
