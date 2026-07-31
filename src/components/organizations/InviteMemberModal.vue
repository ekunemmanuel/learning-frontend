<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useOrganizationStore } from '../../stores/organizationStore'
import type { InvitationSchema } from '../../types/organization'

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  (e: 'invited'): void
}>()

const toast = useToast()
const organizationStore = useOrganizationStore()

const schema = z.object({
  email: z.email('Please enter a valid email address'),
  roleName: z.enum(['Owner', 'Admin', 'Member']),
})

type Schema = z.output<typeof schema>

const formRef = ref()

const formState = reactive<Partial<Schema>>({
  email: '',
  roleName: 'Member',
})

const isSubmitting = ref(false)
const localError = ref<string | null>(null)
const createdInvite = ref<InvitationSchema | null>(null)
const copied = ref(false)

const isEmailValid = computed(() => {
  if (!formState.email || !formState.email.trim()) return false
  return schema.safeParse(formState).success
})

const hasError = computed(() => localError.value || organizationStore.error)

async function handleInvite(event: FormSubmitEvent<Schema>) {
  localError.value = null
  isSubmitting.value = true

  try {
    const invite = await organizationStore.createInvitation({
      email: event.data.email.trim(),
      roleName: event.data.roleName as 'Owner' | 'Admin' | 'Member',
    })
    createdInvite.value = invite
    emit('invited')
    toast.add({
      title: 'Invitation Sent',
      description: `An invitation link has been generated for ${event.data.email}`,
      color: 'success',
    })
  } catch (err: unknown) {
    localError.value = (err as Error).message || 'Failed to send invitation.'
    toast.add({
      title: 'Invitation Failed',
      description: localError.value || '',
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

function copyMagicLink() {
  if (createdInvite.value?.inviteUrl) {
    navigator.clipboard.writeText(createdInvite.value.inviteUrl)
    copied.value = true
    toast.add({
      title: 'Copied',
      description: 'Magic link copied to clipboard.',
      color: 'success',
    })
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

function resetModal() {
  createdInvite.value = null
  formState.email = ''
  formState.roleName = 'Member'
  localError.value = null
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Invite Teammate to Workspace"
    :description="`Send an email invitation link to join ${organizationStore.currentOrganization.name}`"
  >
    <template #body>
      <!-- Success State with Magic Link Copy -->
      <div v-if="createdInvite" class="space-y-4 py-2 text-center">
        <div
          class="w-12 h-12 rounded-full bg-success-100 dark:bg-success-950 text-success-600 dark:text-success-400 flex items-center justify-center mx-auto"
        >
          <UIcon name="i-lucide-check-circle" class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-base font-bold">Invitation Issued Successfully!</h3>
          <p class="text-xs">An invitation email link has been sent to {{ createdInvite.email }}</p>
        </div>

        <div v-if="createdInvite.inviteUrl" class="space-y-2 text-left">
          <div class="flex items-center gap-2">
            <UInput
              :model-value="createdInvite.inviteUrl"
              readonly
              class="w-full text-xs font-mono"
            />
            <UButton
              color="neutral"
              variant="outline"
              :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
              @click="copyMagicLink"
            >
              {{ copied ? 'Copied' : 'Copy' }}
            </UButton>
          </div>
        </div>
      </div>

      <!-- Invite Form -->
      <UForm
        v-else
        ref="formRef"
        :schema="schema"
        :state="formState"
        class="space-y-4"
        @submit="handleInvite"
      >
        <UAlert
          v-if="hasError"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="hasError || ''"
          class="mb-4"
        />

        <UFormField
          label="Teammate Email Address"
          name="email"
          required
          help="e.g. colleague@example.com"
        >
          <UInput
            v-model="formState.email"
            type="email"
            placeholder="colleague@example.com"
            icon="i-lucide-mail"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField label="Assigned Workspace Role" name="roleName">
          <USelect
            v-model="formState.roleName"
            :items="[
              { label: 'Member (Standard access)', value: 'Member' },
              { label: 'Admin (Manage team & settings)', value: 'Admin' },
            ]"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div v-if="createdInvite" class="flex justify-end w-full">
        <UButton color="primary" @click="resetModal"> Done </UButton>
      </div>
      <div v-else class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="resetModal">
          Cancel
        </UButton>
        <UButton
          :color="isEmailValid ? 'primary' : 'neutral'"
          :variant="isEmailValid ? 'solid' : 'ghost'"
          :disabled="!isEmailValid"
          :loading="isSubmitting"
          @click="formRef?.submit()"
        >
          Send Invitation Link
        </UButton>
      </div>
    </template>
  </UModal>
</template>
