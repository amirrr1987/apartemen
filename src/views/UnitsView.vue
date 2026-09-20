<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { totalArea } from '../lib/calc'
import { occupantLabel, parkingLabel } from '../data/defaults'
import { formatMeter, formatPercent, formatToman } from '../lib/format'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const router = useRouter()
const area = computed(() => totalArea(store.state.units))
</script>

<template>
  <div class="page">
    <section class="hero js-enter">
      <p class="hero-label">مجموع زیربنا</p>
      <p class="hero-amount">{{ formatMeter(area) }}</p>
      <p class="hero-unit">مترمربع · {{ store.state.units.length.toLocaleString('fa-IR') }} واحد</p>
    </section>

    <div class="stack">
      <button
        v-for="row in store.summaries"
        :key="row.unit.id"
        class="unit-row js-enter"
        type="button"
        @click="router.push(`/units/${row.unit.id}`)"
      >
        <div class="unit-meta">
          <strong>{{ row.unit.name }}</strong>
          <small>
            {{ occupantLabel(row.unit) }} · {{ formatMeter(row.unit.area) }} متر · {{ parkingLabel(row.unit) }}
          </small>
        </div>
        <div class="unit-aside">
          <div class="unit-amount">{{ formatPercent(row.areaShare * 100) }}</div>
          <small class="text-muted">مانده {{ formatToman(row.remaining) }}</small>
        </div>
      </button>
    </div>
  </div>
</template>
