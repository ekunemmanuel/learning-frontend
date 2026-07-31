<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useOrganizationStore } from '../../stores/organizationStore'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'created'): void
}>()

const organizationStore = useOrganizationStore()

const formState = reactive({
  name: '',
  billingPlan: 'pro',
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
    formState.billingPlan = 'pro'
    emit('created')
    emit('update:open', false)
  } catch (err: unknown) {
    localError.value = (err as Error).message || 'Failed to create workspace.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Create Organization Workspace"
    description="Set up a new multi-tenant workspace to collaborate with your team"
    @update:open="emit('update:open', $event)"
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

        <div>
          <span class="text-xs font-semibold text-gray-500">URL Slug Preview</span>
          <div
            class="mt-1 px-3 py-2 bg-gray-100 dark:bg-gray-900 rounded font-mono text-xs text-gray-600 dark:text-gray-300"
          >
            https://hub.example.com/org/<span
              class="text-primary-600 dark:text-primary-400 font-bold"
              >{{ slugPreview }}</span
            >
          </div>
        </div>

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
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          :disabled="isSubmitting"
          @click="emit('update:open', false)"
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
