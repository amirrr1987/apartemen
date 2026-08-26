<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' },
)
</script>

<template>
  <i class="app-icon bi" :class="[`bi-${name}`, `app-icon--${size}`]" aria-hidden="true" />
</template>
