<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { hasTenant, occupantLabel, partyLabel } from '../data/defaults'
import { formatMeter, formatPercent, formatToman } from '../lib/format'
import { periodLabel } from '../lib/jalali'
import { useAppStore } from '../stores/app'
import { useToast } from '../composables/useToast'

const store = useAppStore()
const router = useRouter()
const { notify } = useToast()

const paidRatio = computed(() => {
  if (store.totals.charge <= 0) return 0
  return Math.max(0, Math.min(100, (store.totals.paid / store.totals.charge) * 100))
})

function download() {
  store.downloadCsv()
  notify('خروجی اکسل این ماه ذخیره شد')
}
</script>

<template>
  <section class="panel hero mb-3 js-enter">
    <div class="hero-label">گزارش {{ periodLabel(store.state.currentPeriod) }}</div>
    <div class="hero-amount">{{ formatToman(store.totals.charge) }} تومان</div>
    <div class="hero-sub">
      <span><AppIcon name="wallet2" size="sm" /> دریافت {{ formatToman(store.totals.paid) }}</span>
      <span><AppIcon name="hourglass-split" size="sm" /> مانده {{ formatToman(store.totals.remaining) }}</span>
    </div>
    <div class="share-bar share-bar-light mt-3">
      <span :style="{ width: `${paidRatio}%` }" />
    </div>
  </section>

  <div class="stat-grid mb-3 js-enter">
    <div class="stat-card">
      <small><AppIcon name="receipt" size="sm" /> هزینه‌ها</small>
      <strong>{{ store.periodExpenses.length.toLocaleString('fa-IR') }}</strong>
    </div>
    <div class="stat-card">
      <small><AppIcon name="wallet2" size="sm" /> دریافت‌ها</small>
      <strong>{{ store.periodPayments.length.toLocaleString('fa-IR') }}</strong>
    </div>
    <div class="stat-card">
      <small><AppIcon name="graph-up" size="sm" /> وصول</small>
      <strong>{{ formatPercent(paidRatio) }}</strong>
    </div>
  </div>

  <section class="panel mb-3 js-enter">
    <h2 class="h6 mb-2">مالک و مستأجر</h2>
    <div class="split-row">
      <span>سهم مالک</span>
      <strong>{{ formatToman(store.totals.ownerCharge) }}</strong>
    </div>
    <div class="split-row">
      <span>مانده مالک</span>
      <strong>{{ formatToman(store.totals.ownerRemaining) }}</strong>
    </div>
    <div class="split-row">
      <span>سهم مستأجر</span>
      <strong>{{ formatToman(store.totals.tenantCharge) }}</strong>
    </div>
    <div class="split-row">
      <span>مانده مستأجر</span>
      <strong>{{ formatToman(store.totals.tenantRemaining) }}</strong>
    </div>
  </section>

  <section class="panel mb-3 js-enter">
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h2 class="h6 m-0">وضعیت واحدها</h2>
      <RouterLink class="chip" to="/units">
        <AppIcon name="building" size="sm" />
        مشخصات واحدها
      </RouterLink>
    </div>
    <div class="report-scroll">
      <table class="report-table">
        <thead>
          <tr>
            <th>واحد</th>
            <th>شارژ</th>
            <th>دریافت</th>
            <th>مانده</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in store.summaries"
            :key="row.unit.id"
            role="button"
            @click="router.push(`/units/${row.unit.id}`)"
          >
            <td>
              <strong>{{ row.unit.name }}</strong>
              <small class="d-block text-muted">{{ occupantLabel(row.unit) }}</small>
            </td>
            <td>{{ formatToman(row.charge) }}</td>
            <td>{{ formatToman(row.paid) }}</td>
            <td>{{ formatToman(row.remaining) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="panel mb-3 js-enter">
    <h2 class="h6 mb-2">سهم متراژ</h2>
    <p class="text-muted small mb-2">
      مبنای قانونی شارژ تناسب با مساحت اختصاصی است؛ مگر هزینه‌ای که به متراژ ربط ندارد.
    </p>
    <div v-for="row in store.summaries" :key="`share-${row.unit.id}`" class="split-row">
      <span>
        {{ row.unit.name }}
        · {{ formatMeter(row.unit.area) }} متر
        · جاری {{ hasTenant(row.unit) ? partyLabel(row.unit.currentPayer) : 'مالک' }}
      </span>
      <strong>{{ formatPercent(row.areaShare * 100) }}</strong>
    </div>
  </section>

  <button class="primary-btn w-100 js-enter" type="button" @click="download">
    <AppIcon name="file-earmark-spreadsheet" size="sm" />
    خروجی اکسل این ماه
  </button>
</template>
