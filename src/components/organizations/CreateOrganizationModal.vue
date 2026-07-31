<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useOrganizationStore } from '../../stores/organizationStore'

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  (e: 'created'): void
}>()

const organizationStore = useOrganizationStore()

const formState = reactive({
  name: '',
  billingPlan: 'free',
})

const isSubmitting = ref(false)
const localError = ref<string | null>(null)

const slugPreview = computed(() => {
  if (!formState.name.trim()) return 'workspace-name'
  return formState.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
})

async function handleCreate() {
  if (!formState.name.trim()) return
  localError.value = null
  isSubmitting.value = true

  try {
    await organizationStore.createOrganization({
      name: formState.name.trim(),
      slug: slugPreview.value,
      billingPlan: formState.billingPlan,
    })
    formState.name = ''
    formState.billingPlan = 'free'
    emit('created')
    open.value = false
  } catch (err: unknown) {
    localError.value = (err as Error).message || 'Failed to create workspace.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Create Organization Workspace"
    description="Set up a new multi-tenant workspace to collaborate with your team"
  >
    <template #body>
      <UForm :state="formState" class="space-y-4 py-2" @submit="handleCreate">
        <!-- Error Alert -->
        <UAlert
          v-if="localError || organizationStore.error"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="localError || organizationStore.error || ''"
          class="mb-4"
        />

        <UFormField
          label="Organization Workspace Name"
          required
          help="e.g. Acme Corp, Starlight SaaS"
        >
          <UInput
            v-model="formState.name"
            placeholder="Starlight SaaS"
            icon="i-lucide-building"
            class="w-full"
            autofocus
          />
        </UFormField>

        <!-- Subscription Billing Plan Selection (Commented out) -->
        <!--
        <UFormField label="Initial Subscription Billing Plan">
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
          />
        </UFormField>
        -->
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          color="neutral"
          variant="outline"
          :disabled="isSubmitting"
          @click="open = false"
        >
          Cancel
        </UButton>
        <UButton
          color="primary"
          :loading="isSubmitting"
          :disabled="!formState.name.trim()"
          @click="handleCreate"
        >
          Create Workspace
        </UButton>
      </div>
    </template>
  </UModal>
</template>
