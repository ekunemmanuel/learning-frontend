<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
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

async function handleCreate(event: FormSubmitEvent<Schema>) {
  localError.value = null
  isSubmitting.value = true

  try {
    await organizationStore.createOrganization({
      name: event.data.name.trim(),
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

const isEmpty = computed(() => !formState.name || !formState.name.trim())
const hasError = computed(() => localError.value || organizationStore.error)
</script>

<template>
  <UModal
    v-model:open="open"
    title="Create Organization Workspace"
    description="Set up a new workspace to collaborate with your team"
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
          v-if="hasError"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="hasError"
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
        <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="open = false">
          Cancel
        </UButton>
        <UButton
          :color="isEmpty ? 'neutral' : 'primary'"
          :loading="isSubmitting"
          :variant="isEmpty ? 'ghost' : 'solid'"
          :disabled="isEmpty"
          @click="formRef?.submit()"
        >
          Create Workspace
        </UButton>
      </div>
    </template>
  </UModal>
</template>
