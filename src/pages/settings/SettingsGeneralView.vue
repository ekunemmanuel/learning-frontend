<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
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
  { immediate: true }
)

const isSubmitting = ref(false)
const isDeleting = ref(false)
const isDeleteConfirmOpen = ref(false)
const localError = ref<string | null>(null)
const localSuccess = ref<string | null>(null)

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
  } catch (err: any) {
    localError.value = err.message || 'Failed to update organization.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleDeleteWorkspace() {
  localError.value = null
  isDeleting.value = true

  try {
    await organizationStore.deleteOrganization()
    isDeleteConfirmOpen.value = false
  } catch (err: any) {
    localError.value = err.message || 'Failed to delete organization.'
    isDeleteConfirmOpen.value = false
  } finally {
    isDeleting.value = false
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
      v-if="localError || organizationStore.error"
      color="error"
      variant="soft"
      icon="i-lucide-alert-circle"
      :title="localError || organizationStore.error || ''"
    />

    <div v-if="organizationStore.isPersonalWorkspace" class="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-xs text-gray-500">
      ℹ️ You are currently viewing your <strong>Personal Workspace</strong>. Personal workspaces are default individual accounts and cannot be renamed or deleted. To manage a multi-tenant organization, switch or create a workspace using the dropdown in the sidebar.
    </div>

    <UForm v-else :state="formState" class="space-y-4" @submit="handleSave">
      <UFormField label="Organization Workspace Name" required help="The public display name of your company or team">
        <UInput v-model="formState.name" class="w-full" :disabled="!organizationStore.isCurrentOrgAdmin" />
      </UFormField>

      <UFormField label="Workspace URL Slug" help="Unique URL identifier for your workspace">
        <UInput :model-value="organizationStore.currentOrganization.slug" readonly class="w-full bg-gray-100 dark:bg-gray-900 font-mono text-xs" />
      </UFormField>

      <UFormField label="Billing Subscription Plan">
        <USelect
          v-model="formState.billingPlan"
          :items="[
            { label: 'Free Plan ($0/mo)', value: 'free' },
            { label: 'Pro Plan ($49/mo)', value: 'pro' },
            { label: 'Enterprise Plan ($199/mo)', value: 'enterprise' },
          ]"
          value-key="value"
          label-key="label"
          class="w-full"
          :disabled="!organizationStore.isCurrentOrgAdmin"
        />
      </UFormField>

      <div v-if="organizationStore.isCurrentOrgAdmin" class="pt-2">
        <UButton type="submit" color="primary" class="font-bold" :loading="isSubmitting">
          Save Changes
        </UButton>
      </div>
    </UForm>

    <!-- Danger Zone for Workspace Deletion -->
    <div
      v-if="!organizationStore.isPersonalWorkspace && organizationStore.isCurrentOrgOwner"
      class="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-3"
    >
      <div class="flex items-center gap-2 text-error-600 dark:text-error-400 font-bold text-sm">
        <UIcon name="i-lucide-alert-triangle" class="w-4 h-4" />
        <span>Danger Zone</span>
      </div>

      <div class="p-4 border border-error-200 dark:border-error-900 bg-error-50/30 dark:bg-error-950/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p class="text-sm font-bold text-gray-900 dark:text-white">Delete Workspace</p>
          <p class="text-xs text-gray-500">
            Soft-delete this organization. Note: All active team members must be removed before deleting.
          </p>
        </div>

        <UButton
          color="error"
          variant="solid"
          size="sm"
          class="font-bold shrink-0"
          @click="isDeleteConfirmOpen = true"
        >
          Delete Workspace
        </UButton>
      </div>
    </div>

    <!-- Confirm Deletion Modal -->
    <UModal
      v-model:open="isDeleteConfirmOpen"
      title="Delete Organization Workspace"
      :description="`Are you sure you want to delete '${organizationStore.currentOrganization.name}'?`"
    >
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="isDeleteConfirmOpen = false">
            Cancel
          </UButton>
          <UButton color="error" :loading="isDeleting" @click="handleDeleteWorkspace">
            Confirm Delete
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
