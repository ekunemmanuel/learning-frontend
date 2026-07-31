<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useOrganizationStore } from '../../stores/organizationStore'
import type { InvitationSchema } from '../../types/organization'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'invited'): void
}>()

const organizationStore = useOrganizationStore()

const formState = reactive({
  email: '',
  roleName: 'Member' as 'Owner' | 'Admin' | 'Member',
})

const isSubmitting = ref(false)
const localError = ref<string | null>(null)
const createdInvite = ref<InvitationSchema | null>(null)
const copied = ref(false)

async function handleInvite() {
  if (!formState.email.trim()) return
  localError.value = null
  isSubmitting.value = true

  try {
    const invite = await organizationStore.createInvitation({
      email: formState.email.trim(),
      roleName: formState.roleName,
    })
    createdInvite.value = invite
    emit('invited')
  } catch (err: unknown) {
    localError.value = (err as Error).message || 'Failed to send invitation.'
  } finally {
    isSubmitting.value = false
  }
}

function copyMagicLink() {
  if (createdInvite.value?.inviteUrl) {
    navigator.clipboard.writeText(createdInvite.value.inviteUrl)
    copied.value = true
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
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Invite Teammate to Workspace"
    :description="`Send an email invitation link to join ${organizationStore.currentOrganization.name}`"
    @update:open="resetModal"
  >
    <template #body>
      <!-- Success State with Magic Link Copy -->
      <div v-if="createdInvite" class="space-y-4 py-2 text-center">
        <div class="w-12 h-12 rounded-full bg-success-100 dark:bg-success-950 text-success-600 dark:text-success-400 flex items-center justify-center mx-auto">
          <UIcon name="i-lucide-check-circle" class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-base font-bold text-gray-900 dark:text-white">Invitation Issued Successfully!</h3>
          <p class="text-xs text-gray-500">An invitation email link has been sent to {{ createdInvite.email }}</p>
        </div>

        <div v-if="createdInvite.inviteUrl" class="space-y-2 text-left bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
          <span class="text-xs font-semibold text-gray-500 uppercase">Magic Link URL</span>
          <div class="flex items-center gap-2">
            <UInput :model-value="createdInvite.inviteUrl" readonly class="w-full text-xs font-mono" />
            <UButton
              color="neutral"
              variant="outline"
              size="xs"
              :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
              @click="copyMagicLink"
            >
              {{ copied ? 'Copied' : 'Copy' }}
            </UButton>
          </div>
        </div>
      </div>

      <!-- Invite Form -->
      <UForm v-else :state="formState" class="space-y-4 py-2" @submit="handleInvite">
        <UAlert
          v-if="localError || organizationStore.error"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="localError || organizationStore.error || ''"
          class="mb-4"
        />

        <UFormField label="Teammate Email Address" required help="e.g. colleague@example.com">
          <UInput
            v-model="formState.email"
            type="email"
            placeholder="colleague@example.com"
            icon="i-lucide-mail"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField label="Assigned Workspace Role">
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
      <div v-if="createdInvite" class="flex justify-end">
        <UButton color="primary" @click="resetModal">
          Done
        </UButton>
      </div>
      <div v-else class="flex justify-end gap-2">
        <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="resetModal">
          Cancel
        </UButton>
        <UButton
          color="primary"
          :loading="isSubmitting"
          :disabled="!formState.email.trim()"
          @click="handleInvite"
        >
          Send Invitation Link
        </UButton>
      </div>
    </template>
  </UModal>
</template>
