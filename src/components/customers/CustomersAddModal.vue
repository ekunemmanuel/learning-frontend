<script setup lang="ts">
import { reactive, ref } from 'vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'add', customer: { name: string; email: string; role: string; status: 'Active' | 'Pending' }): void
}>()

const formState = reactive({
  name: '',
  email: '',
  role: 'Member',
  status: 'Active' as 'Active' | 'Pending',
})

const isSubmitting = ref(false)

function handleSubmit() {
  if (!formState.name || !formState.email) return
  isSubmitting.value = true

  setTimeout(() => {
    emit('add', {
      name: formState.name,
      email: formState.email,
      role: formState.role,
      status: formState.status,
    })
    formState.name = ''
    formState.email = ''
    formState.role = 'Member'
    formState.status = 'Active'
    isSubmitting.value = false
    emit('update:open', false)
  }, 400)
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Add New Member / Customer"
    description="Invite a new member to your workspace or add customer records"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm :state="formState" class="space-y-4 py-2" @submit="handleSubmit">
        <UFormField label="Full Name" required>
          <UInput
            v-model="formState.name"
            placeholder="Jane Doe"
            icon="i-lucide-user"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField label="Email Address" required>
          <UInput
            v-model="formState.email"
            type="email"
            placeholder="jane@example.com"
            icon="i-lucide-mail"
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Role">
            <USelect
              v-model="formState.role"
              :items="['Owner', 'Admin', 'Member', 'Guest']"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Initial Status">
            <USelect
              v-model="formState.status"
              :items="['Active', 'Pending']"
              class="w-full"
            />
          </UFormField>
        </div>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="outline" @click="emit('update:open', false)">
          Cancel
        </UButton>
        <UButton
          color="primary"
          :loading="isSubmitting"
          :disabled="!formState.name || !formState.email"
          @click="handleSubmit"
        >
          Add Customer
        </UButton>
      </div>
    </template>
  </UModal>
</template>
