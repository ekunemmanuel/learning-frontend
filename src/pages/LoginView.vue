<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useOrganizationStore } from '../stores/organizationStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const organizationStore = useOrganizationStore()

const pendingInviteOrg = ref(sessionStorage.getItem('pending_invite_org') || '')
const pendingInviteEmail = ref(sessionStorage.getItem('pending_invite_email') || (route.query.email as string) || '')

onMounted(() => {
  // Clear any stale verification data when returning to the login page
  authStore.clearPendingVerification()
  if (pendingInviteEmail.value) {
    formState.identifier = pendingInviteEmail.value
  }
})

function cancelInvitationNotice() {
  sessionStorage.removeItem('pending_invite_token')
  sessionStorage.removeItem('pending_invite_email')
  sessionStorage.removeItem('pending_invite_org')
  pendingInviteEmail.value = ''
  pendingInviteOrg.value = ''
  formState.identifier = ''
}

const formState = reactive({
  identifier: '',
  password: '',
})

const showPassword = ref(false)
const mfaPin = ref<string[]>([])
const backupCodePin = ref<string[]>([])
const isUsingBackupCode = ref(false)

const isSubmitting = ref(false)
const localError = ref<string | null>(null)

async function handleLogin() {
  if (!formState.identifier || !formState.password) {
    localError.value = 'Please provide both your username/email/phone and password.'
    return
  }

  localError.value = null
  isSubmitting.value = true

  try {
    const result = await authStore.login(formState.identifier, formState.password)
    if (!result.mfaRequired) {
      await organizationStore.checkAndClaimPendingInvitation()
      const redirect = (route.query.redirect as string) || '/dashboard'
      router.push(redirect)
    }
  } catch (err: any) {
    localError.value = err.message || 'Login failed. Please check your credentials.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleMfaSubmit() {
  const rawCode = isUsingBackupCode.value ? backupCodePin.value.join('') : mfaPin.value.join('')

  // Strip hyphens or whitespace before sending payload to backend
  const code = rawCode.replace(/[- ]/g, '')

  if (isUsingBackupCode.value ? code.length < 8 : code.length < 6) {
    localError.value = isUsingBackupCode.value
      ? 'Please enter all 8 characters of your emergency backup code.'
      : 'Please enter all 6 digits of your authenticator code.'
    return
  }

  localError.value = null
  isSubmitting.value = true

  try {
    await authStore.loginMfa(code)
    await organizationStore.checkAndClaimPendingInvitation()
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (err: any) {
    localError.value = err.message || 'Invalid authentication code.'
  } finally {
    isSubmitting.value = false
  }
}

function handleCancelMfa() {
  authStore.cancelMfaStep()
  mfaPin.value = []
  backupCodePin.value = []
  isUsingBackupCode.value = false
  localError.value = null
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <UCard class="w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-800">
      <template #header>
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 mb-1">
            <UIcon
              :name="authStore.mfaRequired ? 'i-lucide-shield-check' : 'i-lucide-log-in'"
              class="w-6 h-6"
            />
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {{ authStore.mfaRequired ? 'Two-Factor Verification' : 'Sign in to your account' }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{
              authStore.mfaRequired
                ? 'Enter the code from your authenticator app or emergency backup code'
                : 'Enter your credentials to access your dashboard'
            }}
          </p>
        </div>
      </template>

      <!-- Invitation Banner with Cancel Button -->
      <div
        v-if="pendingInviteEmail || pendingInviteOrg"
        class="mb-4 p-3.5 bg-info-50 dark:bg-info-950/40 border border-info-200 dark:border-info-900 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2.5">
          <UIcon name="i-lucide-mail-open" class="w-5 h-5 text-info-600 dark:text-info-400 shrink-0" />
          <div>
            <p class="font-bold text-gray-900 dark:text-white">Workspace Invitation Received</p>
            <p class="text-gray-500">Sign in to join {{ pendingInviteOrg || 'the organization' }}.</p>
          </div>
        </div>
        <UButton
          color="neutral"
          variant="outline"
          size="xs"
          icon="i-lucide-x"
          class="shrink-0 font-bold self-end sm:self-auto"
          @click="cancelInvitationNotice"
        >
          Cancel Invite
        </UButton>
      </div>

      <!-- Alert Error -->
      <UAlert
        v-if="localError || authStore.error"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :title="localError || authStore.error || ''"
        class="mb-4"
      />

      <!-- MFA Step 2 Form -->
      <div v-if="authStore.mfaRequired" class="space-y-4">
        <UFormField
          :label="
            isUsingBackupCode ? '8-Character Emergency Backup Code' : '6-Digit Authenticator Code'
          "
          required
          :error="authStore.fieldErrors.mfaCode"
          class="flex flex-col items-center"
        >
          <!-- 6-digit TOTP Pin Input -->
          <div v-if="!isUsingBackupCode" class="flex justify-center w-full mt-2">
            <UPinInput
              v-model="mfaPin"
              :length="6"
              type="text"
              otp
              autofocus
              class="gap-2"
            />
          </div>

          <!-- 8-character Backup Code Pin Input -->
          <div v-else class="flex justify-center w-full mt-2">
            <UPinInput
              v-model="backupCodePin"
              :length="8"
              type="text"
              autofocus
              class="gap-1.5 font-mono"
            />
          </div>
        </UFormField>

        <div class="text-center">
          <UButton
            color="neutral"
            variant="link"
            size="xs"
            class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            @click="isUsingBackupCode = !isUsingBackupCode"
          >
            {{
              isUsingBackupCode
                ? 'Use 6-digit authenticator code instead'
                : 'Lost access? Use emergency backup code'
            }}
          </UButton>
        </div>

        <div class="flex gap-2 pt-2">
          <UButton color="neutral" variant="outline" class="w-1/2 justify-center" @click="handleCancelMfa">
            Back to Sign In
          </UButton>
          <UButton
            color="primary"
            class="w-1/2 justify-center font-semibold"
            :loading="isSubmitting"
            @click="handleMfaSubmit"
          >
            Verify & Sign In
          </UButton>
        </div>
      </div>

      <!-- Standard Login Form -->
      <UForm v-else :state="formState" class="space-y-4" @submit="handleLogin">
        <UFormField
          label="Username, Email, or Phone"
          required
          :error="authStore.fieldErrors.identifier"
        >
          <UInput
            v-model="formState.identifier"
            placeholder="emmanuel or email@example.com"
            icon="i-lucide-user"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Password" required :error="authStore.fieldErrors.password">
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

        <div class="flex items-center justify-end text-xs">
          <RouterLink
            to="/forgot-password"
            class="text-primary hover:text-primary-500 font-semibold"
          >
            Forgot password?
          </RouterLink>
        </div>

        <UButton
          type="submit"
          color="primary"
          size="lg"
          block
          class="w-full justify-center text-base font-semibold py-2.5 mt-2"
          :loading="isSubmitting"
        >
          Sign In
        </UButton>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?
          <RouterLink to="/signup" class="text-primary hover:text-primary-500 font-semibold ml-1">
            Create account
          </RouterLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
