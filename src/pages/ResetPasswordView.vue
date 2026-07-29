<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formState = reactive({
  identifier: (route.query.identifier as string) || '',
  code: (route.query.code as string) || '',
  newPassword: '',
  confirmPassword: '',
})

const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const isSubmitting = ref(false)
const message = ref<string | null>(null)
const localError = ref<string | null>(null)

async function handleResetPassword() {
  if (!formState.identifier || !formState.code || !formState.newPassword) {
    localError.value = 'Please complete all required fields.'
    return
  }

  if (formState.newPassword !== formState.confirmPassword) {
    localError.value = 'Passwords do not match.'
    return
  }

  localError.value = null
  message.value = null
  isSubmitting.value = true

  try {
    const msg = await authStore.resetPassword({
      identifier: formState.identifier,
      code: formState.code,
      newPassword: formState.newPassword,
    })

    message.value = msg || 'Password updated successfully!'

    setTimeout(() => {
      router.push('/login')
    }, 1200)
  } catch (err: any) {
    localError.value = err.message || 'Failed to reset password.'
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
            <UIcon name="i-lucide-lock" class="w-6 h-6" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Set New Password
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Enter your reset code and choose a new secure password
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

      <UForm :state="formState" class="space-y-4" @submit="handleResetPassword">
        <UFormField label="Username, Email or Phone" required>
          <UInput
            v-model="formState.identifier"
            placeholder="pablodev"
            icon="i-lucide-user"
            class="w-full"
          />
        </UFormField>

        <UFormField label="4-Digit Security Code" required>
          <UInput
            v-model="formState.code"
            placeholder="1234"
            icon="i-lucide-hash"
            maxlength="4"
            class="w-full font-mono text-center tracking-wider text-lg"
          />
        </UFormField>

        <UFormField label="New Password" required help="Must be at least 8 characters">
          <UInput
            v-model="formState.newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            placeholder="••••••••"
            icon="i-lucide-key-round"
            class="w-full"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="xs"
                :icon="showNewPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                aria-label="Toggle password visibility"
                class="p-0.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 pointer-events-auto"
                @click="showNewPassword = !showNewPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Confirm New Password" required>
          <UInput
            v-model="formState.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="••••••••"
            icon="i-lucide-key-round"
            class="w-full"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="xs"
                :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                aria-label="Toggle password visibility"
                class="p-0.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 pointer-events-auto"
                @click="showConfirmPassword = !showConfirmPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          size="lg"
          block
          class="w-full justify-center text-base font-semibold py-2.5 mt-2"
          :loading="isSubmitting"
        >
          Reset Password
        </UButton>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
          Return to
          <RouterLink to="/login" class="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-semibold ml-1">
            Sign In
          </RouterLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
