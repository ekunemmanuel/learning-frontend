<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useOrganizationStore } from '../../stores/organizationStore'

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  (e: 'created'): void
}>()

const organizationStore = useOrganizationStore()

const schema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters'),
  billingPlan: z.string().optional(),
})

type Schema = z.output<typeof schema>

const formRef = ref()

const formState = reactive<Partial<Schema>>({
  name: '',
  billingPlan: 'free',
})

const isSubmitting = ref(false)
const localError = ref<string | null>(null)

const slugPreview = computed(() => {
  if (!formState.name || !formState.name.trim()) return 'workspace-name'
  return formState.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
})

async function handleCreate(event: FormSubmitEvent<Schema>) {
  localError.value = null
  isSubmitting.value = true

  try {
    await organizationStore.createOrganization({
      name: event.data.name.trim(),
      slug: slugPreview.value,
      billingPlan: event.data.billingPlan || 'free',
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
      <UForm
        ref="formRef"
        :schema="schema"
        :state="formState"
        class="space-y-4 py-2"
        @submit="handleCreate"
      >
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
          name="name"
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
          :disabled="!formState.name || !formState.name.trim()"
          @click="formRef?.submit()"
        >
          Create Workspace
        </UButton>
      </div>
    </template>
  </UModal>
</template>
