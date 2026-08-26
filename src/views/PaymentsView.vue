<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'
import { partyLabel } from '../data/defaults'
import { formatToman } from '../lib/format'
import { formatFaDate, periodLabel } from '../lib/jalali'
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

const received = computed(() => receipts.value.reduce((sum, payment) => sum + payment.amount, 0))

async function onRemove(id: string) {
  if (!(await confirm('این دریافت حذف شود؟'))) return
  store.removePayment(id)
  notify('دریافت حذف شد')
}
</script>

<template>
  <section class="panel hero mb-3 js-enter">
    <div class="hero-label">دریافت شارژ {{ periodLabel(store.state.currentPeriod) }}</div>
    <div class="hero-amount">{{ formatToman(received) }} تومان</div>
    <div class="hero-sub">
      <span><AppIcon name="wallet2" size="sm" /> {{ receipts.length.toLocaleString('fa-IR') }} دریافت</span>
      <span><AppIcon name="hourglass-split" size="sm" /> مانده {{ formatToman(store.totals.remaining) }}</span>
    </div>
  </section>

  <p class="note info mb-3 js-enter">
    هزینه‌ها سهم هر واحد را می‌سازند؛ اینجا فقط پول‌های دریافت‌شده ثبت می‌شود. برای ثبت دریافت روی واحد بزنید.
  </p>

  <div v-if="!receipts.length" class="panel empty js-enter">
    <p class="mb-2">هنوز دریافتی برای این ماه ثبت نشده.</p>
    <RouterLink class="primary-btn" to="/">
      <AppIcon name="house" size="sm" />
      از گزارش کلی شروع کنید
    </RouterLink>
  </div>

  <article v-for="group in groups" :key="group.row.unit.id" class="panel mb-2 js-enter">
    <button class="expense-open w-100" type="button" @click="router.push(`/units/${group.row.unit.id}`)">
      <div class="d-flex justify-content-between align-items-start gap-2">
        <div>
          <strong>{{ group.row.unit.name }}</strong>
          <small class="d-block text-muted">
            شارژ {{ formatToman(group.row.charge) }} · مانده {{ formatToman(group.row.remaining) }}
          </small>
        </div>
        <span class="chip" :class="group.row.remaining <= 0 && group.row.charge > 0 ? 'ok' : 'muted'">
          {{ group.items.length.toLocaleString('fa-IR') }} دریافت
        </span>
      </div>
    </button>

    <div v-if="group.items.length" class="mt-2">
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
            @click="router.push(`/units/${group.row.unit.id}`)"
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
    <p v-else class="text-muted small mb-0 mt-2">دریافتی ندارد — برای ثبت دریافت وارد واحد شوید.</p>
  </article>
</template>
