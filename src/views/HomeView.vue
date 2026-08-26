<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { useToast } from '../composables/useToast'
import { occupantLabel } from '../data/defaults'
import { formatMeter, formatPercent, formatToman } from '../lib/format'
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
  <section class="panel hero mb-3">
    <div class="hero-label">جمع شارژ این ماه</div>
    <div class="hero-amount">{{ formatToman(store.totals.charge) }} تومان</div>
    <div class="hero-sub">
      <span><AppIcon name="wallet2" size="sm" /> دریافت‌شده {{ formatToman(store.totals.paid) }}</span>
      <span><AppIcon name="hourglass-split" size="sm" /> مانده {{ formatToman(store.totals.remaining) }}</span>
    </div>
    <div class="hero-sub">
      <span><AppIcon name="person" size="sm" /> مالک {{ formatToman(store.totals.ownerCharge) }}</span>
      <span><AppIcon name="people" size="sm" /> مستأجر {{ formatToman(store.totals.tenantCharge) }}</span>
    </div>
    <div class="share-bar share-bar-light mt-3">
      <span :style="{ width: `${paidRatio(store.totals.charge, store.totals.remaining)}%` }" />
    </div>
  </section>

  <p class="note info mb-3">
    مبنای قانونی شارژ، تناسب با مساحت اختصاصی است؛ مگر هزینه‌ای که به متراژ ربط ندارد یا مجمع روش دیگری تصویب کند.
  </p>

  <div v-if="!store.summaries.some((row) => row.charge)" class="panel empty mb-3">
    <p class="mb-2">هنوز هزینه‌ای برای این ماه ثبت نشده.</p>
    <RouterLink class="primary-btn" to="/expenses/new">
      <AppIcon name="plus-lg" size="sm" />
      ثبت اولین هزینه
    </RouterLink>
  </div>

  <button
    v-for="row in store.summaries"
    :key="row.unit.id"
    class="unit-row"
    type="button"
    @click="router.push(`/units/${row.unit.id}`)"
  >
    <div class="unit-index">{{ row.unit.id }}</div>
    <div class="unit-meta">
      <strong>{{ row.unit.name }}</strong>
      <small>
        {{ formatMeter(row.unit.area) }} متر · سهم {{ formatPercent(row.areaShare * 100) }}
        · {{ occupantLabel(row.unit) }}
      </small>
      <div class="share-bar mt-2">
        <span :style="{ width: `${paidRatio(row.charge, row.remaining)}%` }" />
      </div>
    </div>
    <div class="text-end">
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
        {{ row.charge === 0 ? 'بدون شارژ' : row.remaining <= 0 ? 'تسویه شد' : `مانده ${formatToman(row.remaining)}` }}
      </button>
    </div>
  </button>
</template>
