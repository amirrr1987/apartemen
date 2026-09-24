<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'
import { partyLabel } from '../data/defaults'
import { formatToman } from '../lib/format'
import { formatFaDate } from '../lib/jalali'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const router = useRouter()
const { notify } = useToast()
const { confirm } = useConfirm()

const receipts = computed(() => store.periodPayments)

const groups = computed(() =>
  store.summaries.map((row) => ({
    row,
    items: receipts.value.filter((payment) => payment.unitId === row.unit.id),
  })),
)

const groupsWithReceipts = computed(() => groups.value.filter((group) => group.items.length > 0))

const dueUnits = computed(() =>
  store.summaries
    .filter((row) => row.remaining > 0)
    .slice()
    .sort((a, b) => b.remaining - a.remaining),
)

const received = computed(() => receipts.value.reduce((sum, payment) => sum + payment.amount, 0))

async function onRemove(id: string) {
  if (!(await confirm('این دریافت حذف شود؟'))) return
  store.removePayment(id)
  notify('دریافت حذف شد')
}

function statusChip(charge: number, remaining: number) {
  if (charge === 0) return { label: 'بدون شارژ', className: 'muted' }
  if (remaining <= 0) return { label: 'تسویه', className: 'ok' }
  return { label: 'مانده', className: 'accent' }
}
</script>

<template>
  <div class="page">
    <section class="hero js-enter">
      <p class="hero-label">دریافت‌شده این ماه</p>
      <p class="hero-amount">{{ formatToman(received) }}</p>
      <p class="hero-unit">تومان</p>
      <div class="metric-row">
        <div>
          <span class="metric-label">تعداد دریافت</span>
          <strong>{{ receipts.length.toLocaleString('fa-IR') }}</strong>
        </div>
        <div>
          <span class="metric-label">مانده</span>
          <strong>{{ formatToman(store.totals.remaining) }}</strong>
        </div>
      </div>
    </section>

    <div v-if="dueUnits.length" class="panel js-enter">
      <p class="section-label">واحدهای دارای مانده</p>
      <div class="stack">
        <button
          v-for="row in dueUnits"
          :key="row.unit.id"
          class="unit-row"
          type="button"
          @click="router.push(`/units/${row.unit.id}?tab=pay`)"
        >
          <div class="unit-meta">
            <strong>{{ row.unit.name }}</strong>
            <small>ثبت دریافت برای این واحد</small>
          </div>
          <div class="unit-aside">
            <div class="unit-amount">{{ formatToman(row.remaining) }}</div>
            <span class="chip accent">مانده</span>
          </div>
        </button>
      </div>
    </div>

    <div v-if="!receipts.length" class="panel empty js-enter">
      <p class="mb-0">
        {{
          dueUnits.length
            ? 'هنوز دریافتی ثبت نشده. یکی از واحدهای بالا را باز کنید.'
            : store.totals.charge > 0
              ? 'همه واحدها تسویه شده‌اند.'
              : 'ابتدا هزینه ثبت کنید، بعد دریافت شارژ.'
        }}
      </p>
      <RouterLink v-if="!store.totals.charge" class="primary-btn" to="/expenses/new">
        <AppIcon name="plus-lg" size="sm" />
        ثبت هزینه
      </RouterLink>
      <RouterLink v-else-if="!dueUnits.length" class="primary-btn" to="/report">
        <AppIcon name="bar-chart" size="sm" />
        رفتن به گزارش
      </RouterLink>
    </div>

    <div v-else class="stack">
      <p class="section-label js-enter">تاریخچه دریافت‌ها</p>
      <article v-for="group in groupsWithReceipts" :key="group.row.unit.id" class="panel js-enter">
        <button
          class="expense-open w-100"
          type="button"
          @click="router.push(`/units/${group.row.unit.id}?tab=pay`)"
        >
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div>
              <strong>{{ group.row.unit.name }}</strong>
              <small class="d-block text-muted">
                {{
                  group.row.remaining > 0
                    ? `مانده ${formatToman(group.row.remaining)}`
                    : group.row.charge > 0
                      ? 'تسویه کامل'
                      : 'بدون شارژ'
                }}
              </small>
            </div>
            <span class="chip" :class="statusChip(group.row.charge, group.row.remaining).className">
              {{ statusChip(group.row.charge, group.row.remaining).label }}
              · {{ group.items.length.toLocaleString('fa-IR') }} دریافت
            </span>
          </div>
        </button>

        <div class="mt-2">
          <div v-for="payment in group.items" :key="payment.id" class="receipt-row">
            <div>
              <strong>{{ formatToman(payment.amount) }}</strong>
              <small class="d-block text-muted">
                {{ payment.party ? partyLabel(payment.party) : 'واحد' }}
                · {{ formatFaDate(payment.createdAt) }}
              </small>
            </div>
            <div class="d-flex gap-1">
              <button
                class="ghost-btn icon-action"
                type="button"
                aria-label="ویرایش"
                @click="router.push(`/units/${group.row.unit.id}?tab=pay`)"
              >
                <AppIcon name="pencil" size="sm" />
                <span class="action-label">ویرایش</span>
              </button>
              <button
                class="danger-btn icon-action"
                type="button"
                aria-label="حذف"
                @click="onRemove(payment.id)"
              >
                <AppIcon name="trash" size="sm" />
                <span class="action-label">حذف</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
