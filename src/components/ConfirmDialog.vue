<script setup lang="ts">
  import { useConfirm } from '../composables/useConfirm'
  import AppIcon from './AppIcon.vue'

  const { open, text, settle } = useConfirm()
</script>

<template>
  <div v-if="open" class="sheet-backdrop confirm-backdrop" @click.self="settle(false)">
    <div class="panel confirm-dialog" role="dialog" aria-modal="true">
      <p class="mb-3">{{ text }}</p>
      <div class="d-flex gap-2">
        <button class="ghost-btn flex-grow-1" type="button" @click="settle(false)">
          <AppIcon name="x-lg" size="sm" />
          انصراف
        </button>
        <button class="danger-btn flex-grow-1" type="button" @click="settle(true)">
          <AppIcon name="check-lg" size="sm" />
          تأیید
        </button>
      </div>
    </div>
  </div>
</template>
