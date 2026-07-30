<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  open: boolean
  customerName?: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}>()

const isDeleting = ref(false)

function handleConfirm() {
  isDeleting.value = true
  setTimeout(() => {
    emit('confirm')
    isDeleting.value = false
    emit('update:open', false)
  }, 400)
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Delete Customer / Member"
    :description="`Are you sure you want to remove ${props.customerName || 'this member'}? This action cannot be undone.`"
    @update:open="emit('update:open', $event)"
  >
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="outline" @click="emit('update:open', false)">
          Cancel
        </UButton>
        <UButton
          color="error"
          :loading="isDeleting"
          @click="handleConfirm"
        >
          Delete Permanently
        </UButton>
      </div>
    </template>
  </UModal>
</template>
