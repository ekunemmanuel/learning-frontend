<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { z } from 'zod'
import { useOrganizationStore } from '../../stores/organizationStore'

const organizationStore = useOrganizationStore()

const formState = reactive({
  name: organizationStore.currentOrganization.name,
  billingPlan: organizationStore.currentOrganization.billingPlan,
})

watch(
  () => organizationStore.currentOrganization,
  (newOrg) => {
    formState.name = newOrg.name
    formState.billingPlan = newOrg.billingPlan
  },
  { immediate: true },
)

const isSubmitting = ref(false)
const isDeleting = ref(false)
const isDeleteConfirmOpen = ref(false)
const localError = ref<string | null>(null)
const localSuccess = ref<string | null>(null)

// Computed Properties for template boolean conditions
const isPersonalWorkspace = computed(() => organizationStore.isPersonalWorkspace)
const isCurrentOrgAdmin = computed(() => organizationStore.isCurrentOrgAdmin)
const isCurrentOrgOwner = computed(() => organizationStore.isCurrentOrgOwner)
const showDangerZone = computed(() => !isPersonalWorkspace.value && isCurrentOrgOwner.value)
const hasError = computed(() => localError.value || organizationStore.error)

// Delete confirmation & Zod validation
const deleteFormRef = ref()
const expectedNameAllCaps = computed(() => organizationStore.currentOrganization.name.toUpperCase())

const baseDeleteSchema = z.object({
  confirmName: z.string(),
})

type DeleteSchema = z.output<typeof baseDeleteSchema>

const deleteSchema = computed(() =>
  z.object({
    confirmName: z
      .string()
      .refine((val) => val === expectedNameAllCaps.value, {
        message: `Please type '${expectedNameAllCaps.value}' exactly in ALL CAPS to confirm deletion.`,
      }),
  }),
)

const deleteFormState = reactive<Partial<DeleteSchema>>({
  confirmName: '',
})

const isDeleteInputValid = computed(
  () => deleteFormState.confirmName === expectedNameAllCaps.value,
)

// 5-Second Countdown & Undo timer logic
const countdownSeconds = ref(5)
const isCountingDown = ref(false)
let countdownTimer: ReturnType<typeof setInterval> | null = null

function cancelCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  isCountingDown.value = false
  countdownSeconds.value = 5
}

function startDeleteCountdown() {
  isDeleteConfirmOpen.value = false
  isCountingDown.value = true
  countdownSeconds.value = 5

  countdownTimer = setInterval(() => {
    countdownSeconds.value -= 1
    if (countdownSeconds.value <= 0) {
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
      isCountingDown.value = false
      executeDeleteWorkspace()
    }
  }, 1000)
}

async function executeDeleteWorkspace() {
  localError.value = null
  isDeleting.value = true

  try {
    await organizationStore.deleteOrganization()
    localSuccess.value = 'Organization workspace deleted successfully.'
    deleteFormState.confirmName = ''
  } catch (err: unknown) {
    localError.value = (err as Error).message || 'Failed to delete organization.'
  } finally {
    isDeleting.value = false
  }
}

async function handleSave() {
  if (!formState.name.trim()) return
  localError.value = null
  localSuccess.value = null
  isSubmitting.value = true

  try {
    await organizationStore.updateOrganization({
      name: formState.name.trim(),
      billingPlan: formState.billingPlan,
    })
    localSuccess.value = 'Organization workspace updated successfully!'
  } catch (err: unknown) {
    localError.value = (err as Error).message || 'Failed to update organization.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Success Alert -->
    <UAlert
      v-if="localSuccess"
      color="success"
      variant="soft"
      icon="i-lucide-check-circle-2"
      :title="localSuccess"
    />

    <!-- Error Alert -->
    <UAlert
      v-if="hasError"
      color="error"
      variant="soft"
      icon="i-lucide-alert-circle"
      :title="hasError || ''"
    />

    <!-- 5-Second Delete Countdown Alert with Undo -->
    <UAlert
      v-if="isCountingDown"
      color="warning"
      variant="soft"
      icon="i-lucide-timer"
      :title="`Deleting workspace '${organizationStore.currentOrganization.name}' in ${countdownSeconds} seconds...`"
    >
      <template #actions>
        <UButton
          color="warning"
          variant="solid"
          size="xs"
          class="font-bold"
          @click="cancelCountdown"
        >
          Undo Action
        </UButton>
      </template>
    </UAlert>

    <!-- Personal Workspace Info Banner -->
    <div
      v-if="isPersonalWorkspace"
      class="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-xs text-gray-500"
    >
      ℹ️ You are currently viewing your <strong>Personal Workspace</strong>. Personal workspaces are
      default individual accounts and cannot be renamed or deleted. To manage a multi-tenant
      organization, switch or create a workspace using the dropdown in the sidebar.
    </div>

    <UForm v-else :state="formState" class="space-y-4" @submit="handleSave">
      <UFormField
        label="Organization Workspace Name"
        required
        help="The public display name of your company or team"
      >
        <UInput
          v-model="formState.name"
          class="w-full"
          :disabled="!isCurrentOrgAdmin"
        />
      </UFormField>

      <!-- Workspace URL Slug (Commented out) -->
      <!--
      <UFormField label="Workspace URL Slug" help="Unique URL identifier for your workspace">
        <UInput :model-value="organizationStore.currentOrganization.slug" readonly
          class="w-full bg-gray-100 dark:bg-gray-900 font-mono text-xs" />
      </UFormField>
      -->

      <!-- Billing Subscription Plan (Commented out) -->
      <!--
      <UFormField label="Billing Subscription Plan">
        <USelect v-model="formState.billingPlan" :items="[
          { label: 'Free Plan ($0/mo)', value: 'free' },
          { label: 'Pro Plan ($49/mo)', value: 'pro' },
          { label: 'Enterprise Plan ($199/mo)', value: 'enterprise' },
        ]" value-key="value" label-key="label" class="w-full" :disabled="!isCurrentOrgAdmin" />
      </UFormField>
      -->

      <div v-if="isCurrentOrgAdmin" class="pt-2">
        <UButton type="submit" color="primary" class="font-bold" :loading="isSubmitting">
          Save Changes
        </UButton>
      </div>
    </UForm>

    <USeparator v-if="showDangerZone" :ui="{ border: 'border-error', label: 'text-error' }" />

    <!-- Danger Zone for Workspace Deletion -->
    <div v-if="showDangerZone" class="space-y-3">
      <div class="flex items-center gap-2 text-error font-bold text-sm">
        <UIcon name="i-lucide-alert-triangle" class="w-4 h-4" />
        <span>Danger Zone</span>
      </div>

      <div
        class="p-4 border border-error-200 dark:border-error-900 bg-error-50/30 dark:bg-error-950/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <p class="text-sm font-bold text-error">Delete Workspace</p>
          <p class="text-xs text-default">
            Note: All active team members must be removed before deleting.
          </p>
        </div>

        <UButton
          color="error"
          variant="solid"
          size="sm"
          class="font-bold shrink-0"
          :disabled="isCountingDown"
          @click="isDeleteConfirmOpen = true"
        >
          Delete Workspace
        </UButton>
      </div>
    </div>

    <!-- Confirm Deletion Modal with Zod Validation -->
    <UModal
      v-model:open="isDeleteConfirmOpen"
      title="Delete Organization Workspace"
      :description="`This action cannot be undone. To confirm, please type '${expectedNameAllCaps}' below in ALL CAPS.`"
    >
      <template #body>
        <UForm
          ref="deleteFormRef"
          :schema="deleteSchema"
          :state="deleteFormState"
          class="space-y-4 py-2"
          @submit="startDeleteCountdown"
        >
          <UFormField
            :label="`Type '${expectedNameAllCaps}' to confirm`"
            name="confirmName"
            required
          >
            <UInput
              v-model="deleteFormState.confirmName"
              :placeholder="expectedNameAllCaps"
              class="w-full font-mono text-xs uppercase"
              autofocus
            />
          </UFormField>
        </UForm>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton
            color="neutral"
            variant="outline"
            @click="isDeleteConfirmOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            color="error"
            :disabled="!isDeleteInputValid"
            @click="deleteFormRef?.submit()"
          >
            Confirm & Delete Workspace
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
