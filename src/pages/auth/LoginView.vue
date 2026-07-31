<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAuthStore } from '../../stores/authStore'
import { useOrganizationStore } from '../../stores/organizationStore'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()
const organizationStore = useOrganizationStore()

const pendingInviteOrg = ref(sessionStorage.getItem('pending_invite_org') || '')
const pendingInviteEmail = ref(
  sessionStorage.getItem('pending_invite_email') || (route.query.email as string) || '',
)

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

const loginSchema = z.object({
  identifier: z.string().min(1, 'Please enter your username, email, or phone'),
  password: z.string().min(1, 'Please enter your password'),
})

type LoginSchema = z.output<typeof loginSchema>

const formRef = ref()

const formState = reactive<Partial<LoginSchema>>({
  identifier: '',
  password: '',
})

const showPassword = ref(false)
const mfaPin = ref<string[]>([])
const backupCodePin = ref<string[]>([])
const isUsingBackupCode = ref(false)

const isSubmitting = ref(false)

const isLoginValid = computed(() => {
  if (!formState.identifier || !formState.password) return false
  return loginSchema.safeParse(formState).success
})

async function handleLogin(event?: FormSubmitEvent<LoginSchema>) {
  const identifier = event?.data.identifier || formState.identifier
  const password = event?.data.password || formState.password

  if (!identifier || !password) {
    toast.add({
      title: 'Sign In Failed',
      description: 'Please provide both your username/email/phone and password.',
      color: 'error',
    })
    return
  }

  isSubmitting.value = true

  try {
    const result = await authStore.login(identifier, password)

    if (result.requiresVerification) {
      toast.add({
        title: 'Verification Required',
        description:
          result.message ||
          'Please verify your account to continue. A verification code has been sent to your email.',
        color: 'warning',
      })
      router.push('/verify')
      return
    }

    if (!result.mfaRequired) {
      await organizationStore.checkAndClaimPendingInvitation()
      const redirect = (route.query.redirect as string) || '/dashboard'
      router.push(redirect)
    }
  } catch (err: unknown) {
    toast.add({
      title: 'Sign In Failed',
      description: (err as Error).message || 'Login failed. Please check your credentials.',
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

async function handleMfaSubmit() {
  const rawCode = isUsingBackupCode.value ? backupCodePin.value.join('') : mfaPin.value.join('')
  const code = rawCode.replace(/[- ]/g, '')

  if (isUsingBackupCode.value ? code.length < 8 : code.length < 6) {
    toast.add({
      title: 'Verification Failed',
      description: isUsingBackupCode.value
        ? 'Please enter all 8 characters of your emergency backup code.'
        : 'Please enter all 6 digits of your authenticator code.',
      color: 'error',
    })
    return
  }

  isSubmitting.value = true

  try {
    await authStore.loginMfa(code)
    await organizationStore.checkAndClaimPendingInvitation()
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (err: unknown) {
    toast.add({
      title: 'Verification Failed',
      description: (err as Error).message || 'Invalid authentication code.',
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

function handleCancelMfa() {
  authStore.cancelMfaStep()
  mfaPin.value = []
  backupCodePin.value = []
  isUsingBackupCode.value = false
}
</script>

<template>
  <UCard class="w-full max-w-md shadow-xl border border-default">
    <template #header>
      <div class="text-center space-y-2">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-1"
        >
          <UIcon
            :name="authStore.mfaRequired ? 'i-lucide-shield-check' : 'i-lucide-log-in'"
            class="w-6 h-6"
          />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-highlighted">
          {{ authStore.mfaRequired ? 'Two-Factor Verification' : 'Sign in to your account' }}
        </h1>
        <p class="text-sm text-muted">
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
      class="mb-4 p-3.5 bg-primary/5 border border-primary/20 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div class="flex items-center gap-2.5">
        <UIcon name="i-lucide-mail-open" class="w-5 h-5 text-primary shrink-0" />
        <div>
          <p class="font-bold text-highlighted">Workspace Invitation Received</p>
          <p class="text-muted">Sign in to join {{ pendingInviteOrg || 'the organization' }}.</p>
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

    <!-- MFA Step 2 Form -->
    <div v-if="authStore.mfaRequired" class="space-y-4">
      <UFormField
        :label="
          isUsingBackupCode ? '8-Character Emergency Backup Code' : '6-Digit Authenticator Code'
        "
        required
        class="flex flex-col items-center"
      >
        <!-- 6-digit TOTP Pin Input -->
        <div v-if="!isUsingBackupCode" class="flex justify-center w-full mt-2">
          <UPinInput v-model="mfaPin" :length="6" type="text" otp autofocus class="gap-2" />
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
          class="text-muted hover:text-highlighted"
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
        <UButton
          color="neutral"
          variant="outline"
          class="w-1/2 justify-center"
          @click="handleCancelMfa"
        >
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
    <UForm
      v-else
      ref="formRef"
      :schema="loginSchema"
      :state="formState"
      class="space-y-4"
      @submit="handleLogin"
    >
      <UFormField
        label="Username, Email, or Phone"
        name="identifier"
        required
        help="Enter your registered email address, username, or phone"
      >
        <UInput
          v-model="formState.identifier"
          placeholder="emmanuel or email@example.com"
          icon="i-lucide-user"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Password" name="password" required help="Enter your account password">
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
              class="p-0.5 text-dimmed hover:text-highlighted pointer-events-auto"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <div class="flex items-center justify-end text-xs">
        <RouterLink to="/forgot-password" class="text-primary font-semibold hover:underline">
          Forgot password?
        </RouterLink>
      </div>

      <UButton
        :color="isLoginValid ? 'primary' : 'neutral'"
        :variant="isLoginValid ? 'solid' : 'ghost'"
        :disabled="!isLoginValid"
        :loading="isSubmitting"
        size="lg"
        block
        class="w-full justify-center text-base font-semibold py-2.5 mt-2"
        @click="formRef?.submit()"
      >
        Sign In
      </UButton>
    </UForm>

    <template #footer>
      <p class="text-center text-sm text-muted">
        Don't have an account?
        <RouterLink to="/signup" class="text-primary font-semibold hover:underline ml-1">
          Create account
        </RouterLink>
      </p>
    </template>
  </UCard>
</template>
