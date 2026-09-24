<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { useToast } from '../composables/useToast'
import { occupantLabel } from '../data/defaults'
import { formatMeter, formatToman } from '../lib/format'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const router = useRouter()
const { notify } = useToast()

const hasCosts = computed(() => store.periodExpenses.length > 0 || store.totals.charge > 0)
const hasRemaining = computed(() => store.totals.remaining > 0)
const isCollected = computed(() => hasCosts.value && !hasRemaining.value)

const steps = computed(() => {
  const costsDone = hasCosts.value
  const collectDone = isCollected.value
  const reportReady = costsDone
  return [
    {
      id: 'costs',
      label: 'هزینه‌ها',
      done: costsDone,
      active: !costsDone,
    },
    {
      id: 'collect',
      label: 'وصول',
      done: collectDone,
      active: costsDone && !collectDone,
    },
    {
      id: 'report',
      label: 'گزارش',
      done: collectDone,
      active: reportReady && collectDone,
    },
  ]
})

const nextAction = computed(() => {
  if (!hasCosts.value) {
    return {
      to: '/expenses/new',
      label: 'ثبت اولین هزینه',
      hint: 'ماه را با ثبت هزینه‌های مشترک شروع کنید.',
      icon: 'plus-lg',
    }
  }
  if (hasRemaining.value) {
    const first = sortedUnits.value.find((row) => row.remaining > 0)
    return {
      to: first ? `/units/${first.unit.id}?tab=pay` : '/payments',
      label: 'وصول مانده‌ها',
      hint: `${formatToman(store.totals.remaining)} تومان هنوز دریافت نشده.`,
      icon: 'wallet2',
    }
  }
  return {
    to: '/report',
    label: 'مشاهده گزارش',
    hint: 'همه واحدها تسویه شدند؛ گزارش ماه آماده است.',
    icon: 'bar-chart',
  }
})

const sortedUnits = computed(() =>
  store.summaries.slice().sort((a, b) => {
    if (b.remaining !== a.remaining) return b.remaining - a.remaining
    if (b.charge !== a.charge) return b.charge - a.charge
    return a.unit.name.localeCompare(b.unit.name, 'fa')
  }),
)

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

function statusLabel(charge: number, remaining: number) {
  if (charge === 0) return 'بدون شارژ'
  if (remaining <= 0) return 'تسویه'
  return `مانده ${formatToman(remaining)}`
}

function statusIcon(charge: number, remaining: number) {
  if (charge === 0) return 'dash-circle'
  if (remaining <= 0) return 'check-circle-fill'
  return 'hourglass-split'
}

function openUnit(unitId: number, remaining: number) {
  const tab = remaining > 0 ? 'pay' : 'split'
  void router.push(`/units/${unitId}?tab=${tab}`)
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

    <nav class="month-journey js-enter" aria-label="مراحل ماه">
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="month-journey__step"
        :class="{ done: step.done, active: step.active }"
      >
        <span class="month-journey__index" aria-hidden="true">
          <AppIcon v-if="step.done" name="check-lg" size="sm" />
          <template v-else>{{ (index + 1).toLocaleString('fa-IR') }}</template>
        </span>
        <span class="month-journey__label">{{ step.label }}</span>
      </div>
    </nav>

    <div class="panel next-action js-enter">
      <p class="next-action__hint">{{ nextAction.hint }}</p>
      <RouterLink class="primary-btn w-100" :to="nextAction.to">
        <AppIcon :name="nextAction.icon" size="sm" />
        {{ nextAction.label }}
      </RouterLink>
    </div>

    <div v-if="!hasCosts" class="panel empty js-enter">
      <p class="mb-0">هنوز هزینه‌ای برای این ماه ثبت نشده.</p>
    </div>

    <div v-else class="stack">
      <p class="section-label js-enter">واحدها · اولویت با مانده</p>
      <button
        v-for="row in sortedUnits"
        :key="row.unit.id"
        class="unit-row js-enter"
        type="button"
        @click="openUnit(row.unit.id, row.remaining)"
      >
        <div class="unit-meta">
          <strong>{{ row.unit.name }}</strong>
          <small>{{ occupantLabel(row.unit) }} · {{ formatMeter(row.unit.area) }} متر</small>
        </div>
        <div class="unit-aside">
          <div class="unit-amount">{{ formatToman(row.charge) }}</div>
          <button
            class="pay-btn mt-1"
            :class="{
              paid: row.remaining <= 0 && row.charge > 0,
              due: row.remaining > 0,
            }"
            type="button"
            @click.stop="togglePaid(row.unit.id, row.remaining)"
          >
            <AppIcon :name="statusIcon(row.charge, row.remaining)" size="sm" />
            {{ statusLabel(row.charge, row.remaining) }}
          </button>
        </div>
      </button>
    </div>
  </div>
</template>
