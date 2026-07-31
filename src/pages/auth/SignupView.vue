<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAuthStore } from '../../stores/authStore'
import { COUNTRIES } from '../../data/countries'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()

const pendingInviteOrg = ref(sessionStorage.getItem('pending_invite_org') || '')
const pendingInviteEmail = ref(
  sessionStorage.getItem('pending_invite_email') || (route.query.email as string) || '',
)

// String refs for USelectMenu value-key bindings
const selectedCountryCode = ref<string>('NG')
const selectedDialCode = ref<string>('+234')
const rawPhoneNumber = ref('')

const selectedCountry = computed(() => {
  return COUNTRIES.find((c) => c.code === selectedCountryCode.value) || COUNTRIES[0]
})

// Automatically update phone dial code when country changes
watch(selectedCountryCode, (newCode) => {
  const matched = COUNTRIES.find((c) => c.code === newCode)
  if (matched) {
    selectedDialCode.value = matched.dialCode
  }
})

const fullPhoneNumber = computed(() => {
  if (!rawPhoneNumber.value.trim()) return ''
  const cleanNum = rawPhoneNumber.value.trim().replace(/^[+]/, '')
  if (rawPhoneNumber.value.trim().startsWith('+')) {
    return rawPhoneNumber.value.trim()
  }
  return `${selectedDialCode.value}${cleanNum}`
})

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
})

type SignupSchema = z.output<typeof signupSchema>

const formRef = ref()

const formState = reactive<Partial<SignupSchema>>({
  name: '',
  username: '',
  email: '',
  password: '',
})

onMounted(() => {
  if (pendingInviteEmail.value) {
    formState.email = pendingInviteEmail.value
  }
})

function cancelInvitationNotice() {
  sessionStorage.removeItem('pending_invite_token')
  sessionStorage.removeItem('pending_invite_email')
  sessionStorage.removeItem('pending_invite_org')
  pendingInviteEmail.value = ''
  pendingInviteOrg.value = ''
  formState.email = ''
}

const showPassword = ref(false)
const isSubmitting = ref(false)

const isSignupValid = computed(() => {
  if (!formState.name || !formState.username || !formState.email || !formState.password) {
    return false
  }
  return signupSchema.safeParse(formState).success
})

async function handleSignup(event: FormSubmitEvent<SignupSchema>) {
  isSubmitting.value = true

  try {
    await authStore.signup({
      name: event.data.name,
      username: event.data.username,
      email: event.data.email,
      phone: fullPhoneNumber.value || undefined,
      country: selectedCountry.value?.name || undefined,
      password: event.data.password,
    })

    toast.add({
      title: 'Account Created',
      description: 'Please check your email for the verification code.',
      color: 'success',
    })

    // Navigate cleanly to /verify without URL parameters
    router.push('/verify')
  } catch (err: unknown) {
    toast.add({
      title: 'Registration Failed',
      description: (err as Error).message || 'Registration failed.',
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-lg shadow-xl border border-default">
    <template #header>
      <div class="text-center space-y-2">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-1"
        >
          <UIcon name="i-lucide-user-plus" class="w-6 h-6" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-highlighted">Create an Account</h1>
        <p class="text-sm text-muted">Sign up to get started with your account</p>
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
          <p class="text-muted">
            Create your account to join {{ pendingInviteOrg || 'the organization' }}.
          </p>
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

    <UForm
      ref="formRef"
      :schema="signupSchema"
      :state="formState"
      class="space-y-4"
      @submit="handleSignup"
    >
      <UFormField label="Full Name" name="name" required help="Your full legal or display name">
        <UInput
          v-model="formState.name"
          placeholder="Pablo Dev"
          icon="i-lucide-id-card"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Username"
        name="username"
        required
        help="Unique handle for your account (e.g. pablodev)"
      >
        <UInput
          v-model="formState.username"
          placeholder="pablodev"
          icon="i-lucide-at-sign"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Email Address"
        name="email"
        required
        help="Your primary email address for login & notifications"
      >
        <UInput
          v-model="formState.email"
          type="email"
          placeholder="pablo@example.com"
          icon="i-lucide-mail"
          class="w-full"
          :readonly="!!pendingInviteEmail"
        />
      </UFormField>

      <!-- Searchable Country Select -->
      <UFormField label="Country" help="Select your country of residence">
        <USelectMenu
          v-model="selectedCountryCode"
          :items="COUNTRIES"
          value-key="code"
          label-key="label"
          :filter-fields="['label', 'name', 'code', 'dialCode']"
          class="w-full"
        />
      </UFormField>

      <!-- Searchable Dial Code + Phone Input -->
      <UFormField label="Phone Number" help="Search dial code & enter number">
        <div class="flex gap-2">
          <USelectMenu
            v-model="selectedDialCode"
            :items="COUNTRIES"
            value-key="dialCode"
            label-key="dialCode"
            :filter-fields="['label', 'name', 'code', 'dialCode']"
            class="w-28 shrink-0"
          />
          <UInput
            v-model="rawPhoneNumber"
            placeholder="9039215387"
            icon="i-lucide-phone"
            class="w-full flex-1"
          />
        </div>
      </UFormField>

      <UFormField
        label="Password"
        name="password"
        required
        help="Must be at least 8 characters long"
      >
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

      <UButton
        :color="isSignupValid ? 'primary' : 'neutral'"
        :variant="isSignupValid ? 'solid' : 'ghost'"
        :disabled="!isSignupValid"
        :loading="isSubmitting"
        size="lg"
        block
        class="w-full justify-center text-base font-semibold py-2.5 mt-4"
        @click="formRef?.submit()"
      >
        Create Account
      </UButton>
    </UForm>

    <template #footer>
      <p class="text-center text-sm text-muted">
        Already have an account?
        <RouterLink to="/login" class="text-primary font-semibold hover:underline ml-1">
          Sign in
        </RouterLink>
      </p>
    </template>
  </UCard>
</template>
