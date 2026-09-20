<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { totalArea } from '../lib/calc'
import { hasTenant, occupantLabel, parkingLabel, partyLabel } from '../data/defaults'
import { formatMeter, formatPercent, formatPeople, formatToman } from '../lib/format'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const router = useRouter()
const area = computed(() => totalArea(store.state.units))
</script>

<template>
  <section class="panel mb-3">
    <div class="d-flex justify-content-between">
      <div>
        <div class="text-muted">
          <AppIcon name="bounding-box" size="sm" />
          مجموع زیربنای اختصاصی
        </div>
        <strong class="fs-4">{{ formatMeter(area) }} مترمربع</strong>
      </div>
      <span class="chip">{{ store.state.units.length.toLocaleString('fa-IR') }} واحد</span>
    </div>
  </section>

  <button
    v-for="row in store.summaries"
    :key="row.unit.id"
    class="panel text-start mb-2 w-100"
    type="button"
    @click="router.push(`/units/${row.unit.id}`)"
  >
    <div class="d-flex justify-content-between">
      <strong>{{ row.unit.name }}</strong>
      <span class="chip">{{ formatPercent(row.areaShare * 100) }}</span>
    </div>
    <small class="text-muted">
      {{ formatMeter(row.unit.area) }} متر · {{ occupantLabel(row.unit) }} · {{ parkingLabel(row.unit) }}
      · {{ formatPeople(row.unit.residents) }} ساکن
      <template v-if="row.guestNights > 0"> · {{ formatPeople(row.guestNights) }} نفرشب مهمان</template>
    </small>
    <small class="d-block text-muted">
      جاری: {{ hasTenant(row.unit) ? partyLabel(row.unit.currentPayer) : 'مالک' }}
      · اساسی: {{ partyLabel(row.unit.capitalPayer) }}
      · مانده {{ formatToman(row.remaining) }}
    </small>
    <div class="share-bar">
      <span :style="{ width: `${row.areaShare * 100}%` }" />
    </div>
  </button>
</template>
