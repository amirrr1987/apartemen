<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { useToast } from '../composables/useToast'
import { occupantLabel } from '../data/defaults'
import { formatMeter, formatToman } from '../lib/format'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const router = useRouter()
const { notify } = useToast()

function togglePaid(unitId: number, remaining: number) {
  if (remaining <= 0) {
    store.markUnpaid(unitId)
    notify('وضعیت پرداخت برداشته شد')
    return
  }
  store.markPaid(unitId)
  notify('واحد تسویه شد')
}

function paidRatio(charge: number, remaining: number) {
  if (charge <= 0) return 0
  return Math.max(0, Math.min(100, ((charge - remaining) / charge) * 100))
}
</script>

<template>
  <div class="page">
    <section class="hero js-enter">
      <p class="hero-label">شارژ این ماه</p>
      <p class="hero-amount">{{ formatToman(store.totals.charge) }}</p>
      <p class="hero-unit">تومان</p>
      <div class="metric-row">
        <div>
          <span class="metric-label">دریافت‌شده</span>
          <strong>{{ formatToman(store.totals.paid) }}</strong>
        </div>
        <div>
          <span class="metric-label">مانده</span>
          <strong>{{ formatToman(store.totals.remaining) }}</strong>
        </div>
      </div>
      <div v-if="store.totals.charge" class="share-bar" aria-hidden="true">
        <span :style="{ width: `${paidRatio(store.totals.charge, store.totals.remaining)}%` }" />
      </div>
    </section>

    <div v-if="!store.summaries.some((row) => row.charge)" class="panel empty js-enter">
      <p class="mb-0">هنوز هزینه‌ای برای این ماه ثبت نشده.</p>
      <RouterLink class="primary-btn" to="/expenses/new">
        <AppIcon name="plus-lg" size="sm" />
        ثبت اولین هزینه
      </RouterLink>
    </div>

    <div v-else class="stack">
      <button
        v-for="row in store.summaries"
        :key="row.unit.id"
        class="unit-row js-enter"
        type="button"
        @click="router.push(`/units/${row.unit.id}`)"
      >
        <div class="unit-meta">
          <strong>{{ row.unit.name }}</strong>
          <small>{{ occupantLabel(row.unit) }} · {{ formatMeter(row.unit.area) }} متر</small>
        </div>
        <div class="unit-aside">
          <div class="unit-amount">{{ formatToman(row.charge) }}</div>
          <button
            class="pay-btn mt-1"
            :class="{ paid: row.remaining <= 0 && row.charge > 0 }"
            type="button"
            @click.stop="togglePaid(row.unit.id, row.remaining)"
          >
            <AppIcon
              :name="row.charge === 0 ? 'dash-circle' : row.remaining <= 0 ? 'check-circle-fill' : 'hourglass-split'"
              size="sm"
            />
            {{ row.charge === 0 ? 'بدون شارژ' : row.remaining <= 0 ? 'تسویه' : `مانده ${formatToman(row.remaining)}` }}
          </button>
        </div>
      </button>
    </div>
  </div>
</template>
