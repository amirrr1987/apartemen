<script setup lang="ts">
  import { useDrag } from '@vueuse/gesture'
  import { ref } from 'vue'
  import AppIcon from './AppIcon.vue'
  import { usePeriod } from '../composables/usePeriod'

  const { label, shift } = usePeriod()
  const target = ref<HTMLElement | null>(null)

  useDrag(
    ({ movement: [mx], last, canceled }) => {
      if (!last || canceled) return
      if (mx > 64) shift(-1)
      if (mx < -64) shift(1)
    },
    { domTarget: target, axis: 'x', filterTaps: true }
  )
</script>

<template>
  <div ref="target" class="month-nav" title="برای تغییر ماه بکشید">
    <button class="icon-btn" type="button" aria-label="ماه بعد" @click="shift(1)">
      <AppIcon name="chevron-right" />
    </button>
    <strong>{{ label }}</strong>
    <button class="icon-btn" type="button" aria-label="ماه قبل" @click="shift(-1)">
      <AppIcon name="chevron-left" />
    </button>
  </div>
</template>
