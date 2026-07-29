<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const formState = reactive({
  name: '',
  username: '',
  email: '',
  phone: '',
  country: '',
  password: '',
})

const showPassword = ref(false)
const isSubmitting = ref(false)
const localError = ref<string | null>(null)

async function handleSignup() {
  if (!formState.name || !formState.email || !formState.username || !formState.password) {
    localError.value = 'Please fill out all required fields.'
    return
  }

  localError.value = null
  isSubmitting.value = true

  try {
    await authStore.signup({
      name: formState.name,
      username: formState.username,
      email: formState.email,
      phone: formState.phone || undefined,
      country: formState.country || undefined,
      password: formState.password,
    })

    // Navigate to clean /verify route without exposing parameters in URL
    router.push('/verify')
  } catch (err: any) {
    localError.value = err.message || 'Registration failed.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 py-8">
    <UCard class="w-full max-w-lg shadow-xl border border-gray-200 dark:border-gray-800">
      <template #header>
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 mb-1">
            <UIcon name="i-lucide-user-plus" class="w-6 h-6" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Create an Account
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Sign up to get started with your account
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

      <UForm :state="formState" class="space-y-4" @submit="handleSignup">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Full Name" required>
            <UInput
              v-model="formState.name"
              placeholder="Pablo Dev"
              icon="i-lucide-id-card"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Username" required>
            <UInput
              v-model="formState.username"
              placeholder="pablodev"
              icon="i-lucide-at-sign"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="Email Address" required>
          <UInput
            v-model="formState.email"
            type="email"
            placeholder="pablo@example.com"
            icon="i-lucide-mail"
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Phone Number" help="Optional (e.g. +12025550143)">
            <UInput
              v-model="formState.phone"
              placeholder="+12025550143"
              icon="i-lucide-phone"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Country" help="Optional (e.g. united states)">
            <UInput
              v-model="formState.country"
              placeholder="united states"
              icon="i-lucide-globe"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="Password" required help="Must be at least 8 characters">
          <UInput
            v-model="formState.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            icon="i-lucide-key-round"
            class="w-full"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="xs"
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                aria-label="Toggle password visibility"
                class="p-0.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 pointer-events-auto"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          size="lg"
          block
          class="w-full justify-center text-base font-semibold py-2.5 mt-4"
          :loading="isSubmitting"
        >
          Create Account
        </UButton>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?
          <RouterLink to="/login" class="text-primary hover:text-primary-500 font-semibold ml-1">
            Sign in
          </RouterLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
