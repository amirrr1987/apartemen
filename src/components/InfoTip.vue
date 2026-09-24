<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { ref } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  text: string
}>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

onClickOutside(root, () => {
  open.value = false
})

function toggle() {
  open.value = !open.value
}
</script>

<template>
  <span ref="root" class="info-tip">
    <button
      class="info-tip-btn"
      type="button"
      aria-label="راهنمای این فیلد"
      :aria-expanded="open"
      @click="toggle"
    >
      <AppIcon name="info-circle" size="sm" />
    </button>
    <div v-show="open" class="info-tip-box" role="tooltip">
      {{ props.text }}
    </div>
  </span>
</template>
