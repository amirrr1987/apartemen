<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { createPopper, type Instance } from '@popperjs/core'
import { nextTick, onBeforeUnmount, ref } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  text: string
}>()

const open = ref(false)
const trigger = ref<HTMLButtonElement | null>(null)
const tooltip = ref<HTMLElement | null>(null)
const root = ref<HTMLElement | null>(null)
let popper: Instance | null = null

onClickOutside(root, () => {
  open.value = false
})

async function toggle() {
  open.value = !open.value
  await nextTick()
  popper?.destroy()
  popper = null
  if (open.value && trigger.value && tooltip.value) {
    popper = createPopper(trigger.value, tooltip.value, {
      placement: 'top',
      modifiers: [{ name: 'offset', options: { offset: [0, 8] } }],
    })
  }
}

onBeforeUnmount(() => popper?.destroy())
</script>

<template>
  <span ref="root" class="info-tip">
    <button
      ref="trigger"
      class="info-tip-btn"
      type="button"
      aria-label="راهنمای این فیلد"
      :aria-expanded="open"
      @click="toggle"
    >
      <AppIcon name="info-circle" size="sm" />
    </button>
    <div v-show="open" ref="tooltip" class="info-tip-box" role="tooltip">
      {{ props.text }}
    </div>
  </span>
</template>
