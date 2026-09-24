<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'
import { COST_TYPES, clampPersonWeight, hasTenant, natureLabel, partyLabel } from '../data/defaults'
import { occupancyOf } from '../lib/calc'
import { formatFaDate, daysInPeriod, periodLabel } from '../lib/jalali'
import { formatPeople, formatToman, parseAmount } from '../lib/format'
import { useAppStore } from '../stores/app'
import type { PartyRole, Payment } from '../types'

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const { notify } = useToast()
const { confirm } = useConfirm()

const unitId = computed(() => Number(route.params.id))
const unit = computed(() => store.state.units.find((item) => item.id === unitId.value))
const summary = computed(() => store.summaries.find((item) => item.unit.id === unitId.value))
const receipts = computed(() => (unit.value ? store.unitPayments(unit.value.id) : []))

watch(unit, (value) => {
  if (!value) void router.replace('/payments')
}, { immediate: true })

const tab = ref<'pay' | 'split' | 'info'>('pay')

function tabFromQuery(raw: unknown): 'pay' | 'split' | 'info' {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value === 'split' || value === 'info' || value === 'pay') return value
  return 'pay'
}

watch(
  () => route.query.tab,
  (value) => {
    tab.value = tabFromQuery(value)
  },
  { immediate: true },
)

const residentsText = ref(String(unit.value?.residents ?? 0))
const guestNightsText = ref(String(store.guestNights(unitId.value)))
const areaText = ref(String(unit.value?.area ?? 0))
const owner = ref(unit.value?.owner ?? '')
const tenant = ref(unit.value?.tenant ?? '')
const currentPayer = ref<PartyRole>(unit.value?.currentPayer ?? 'TENANT')
const capitalPayer = ref<PartyRole>(unit.value?.capitalPayer ?? 'OWNER')
const notes = ref(unit.value?.notes ?? '')
const hasParking = ref(unit.value?.hasParking ?? false)

const payAmount = ref('')
const payParty = ref<'OWNER' | 'TENANT' | 'UNIT'>('OWNER')
const editingPaymentId = ref<string | null>(null)

watch(
  () => [unit.value, store.state.currentPeriod] as const,
  ([value]) => {
    if (!value) return
    residentsText.value = String(value.residents)
    guestNightsText.value = String(store.guestNights(value.id))
    areaText.value = String(value.area)
    owner.value = value.owner
    tenant.value = value.tenant
    currentPayer.value = value.currentPayer
    capitalPayer.value = value.capitalPayer
    notes.value = value.notes
    hasParking.value = value.hasParking
    payParty.value = hasTenant(value) ? 'TENANT' : 'OWNER'
  },
  { immediate: true },
)

const guestNightsDraft = computed(() => Math.max(0, Math.round(Number(guestNightsText.value.replace(/[^\d]/g, '')) || 0)))
const occupancyDraft = computed(() => {
  const residents = Math.max(0, Math.round(Number(residentsText.value.replace(/[^\d]/g, '')) || 0))
  return occupancyOf({ residents }, guestNightsDraft.value, daysInPeriod(store.state.currentPeriod))
})
const guestEquivalentDraft = computed(() => occupancyDraft.value - Math.max(0, Math.round(Number(residentsText.value.replace(/[^\d]/g, '')) || 0)))

function typeLabel(type: string) {
  return COST_TYPES.find((item) => item.value === type)?.label ?? type
}

function splitLabel(expense: { type: string; personWeight?: number }) {
  const base = typeLabel(expense.type)
  if (expense.type !== 'HYBRID') return base
  const person = Math.round(clampPersonWeight(expense.personWeight) * 100)
  return `${base} ${person}٪ نفر`
}

function receiptPartyLabel(party?: PartyRole) {
  return party ? partyLabel(party) : 'واحد'
}

function partyFromForm(): PartyRole | undefined {
  return payParty.value === 'UNIT' ? undefined : payParty.value
}

function remainingForForm() {
  if (!summary.value) return 0
  if (payParty.value === 'OWNER') return summary.value.ownerRemaining
  if (payParty.value === 'TENANT') return summary.value.tenantRemaining
  return summary.value.remaining
}

function fillRemaining() {
  const remaining = Math.round(remainingForForm())
  if (remaining > 0) payAmount.value = String(remaining)
}

function resetPaymentForm() {
  editingPaymentId.value = null
  payAmount.value = ''
}

function savePayment() {
  const amount = parseAmount(payAmount.value)
  if (!unit.value || amount <= 0) return
  if (editingPaymentId.value) {
    store.updatePayment(editingPaymentId.value, { amount, party: partyFromForm() })
    notify('دریافت ویرایش شد')
  } else {
    store.addPayment({ unitId: unit.value.id, amount, party: partyFromForm() })
    notify('دریافت ثبت شد')
  }
  resetPaymentForm()
}

function startEdit(payment: Payment) {
  editingPaymentId.value = payment.id
  payAmount.value = String(payment.amount)
  payParty.value = payment.party ?? 'UNIT'
}

async function onRemovePayment(id: string) {
  if (!(await confirm('این دریافت حذف شود؟'))) return
  store.removePayment(id)
  if (editingPaymentId.value === id) resetPaymentForm()
  notify('دریافت حذف شد')
}

function saveUnit() {
  if (!unit.value) return
  unit.value.residents = Math.max(0, Math.round(Number(residentsText.value.replace(/[^\d]/g, '')) || 0))
  store.setGuestNights(unit.value.id, guestNightsDraft.value)
  unit.value.area = Math.max(0, parseAmount(areaText.value))
  unit.value.owner = owner.value.trim()
  unit.value.tenant = tenant.value.trim()
  unit.value.currentPayer = currentPayer.value
  unit.value.capitalPayer = capitalPayer.value
  unit.value.hasParking = hasParking.value
  unit.value.notes = notes.value.trim()
  notify('اطلاعات واحد ذخیره شد')
}

function togglePaid(party?: PartyRole) {
  if (!unit.value || !summary.value) return
  if (!party) {
    if (summary.value.remaining <= 0) {
      store.markUnpaid(unit.value.id)
      notify('وضعیت پرداخت برداشته شد')
      return
    }
    store.markPaid(unit.value.id)
    notify('واحد تسویه شد')
    return
  }
  const remaining = party === 'OWNER' ? summary.value.ownerRemaining : summary.value.tenantRemaining
  if (remaining <= 0) {
    store.markUnpaid(unit.value.id, party)
    notify(`تسویه ${partyLabel(party)} برداشته شد`)
    return
  }
  store.markPaid(unit.value.id, party)
  notify(`سهم ${partyLabel(party)} تسویه شد`)
}
</script>

<template>
  <div v-if="unit && summary" class="page">
    <section class="hero">
      <p class="hero-label">{{ unit.name }}</p>
      <p class="hero-amount">{{ formatToman(summary.charge) }}</p>
      <p class="hero-unit">تومان · مانده {{ formatToman(summary.remaining) }}</p>
    </section>

    <div class="segmented">
      <button type="button" :class="{ active: tab === 'pay' }" @click="tab = 'pay'">
        <AppIcon name="wallet2" size="sm" />
        دریافت
      </button>
      <button type="button" :class="{ active: tab === 'split' }" @click="tab = 'split'">
        <AppIcon name="list-ul" size="sm" />
        ریز هزینه
      </button>
      <button type="button" :class="{ active: tab === 'info' }" @click="tab = 'info'">
        <AppIcon name="building" size="sm" />
        مشخصات
      </button>
    </div>

    <template v-if="tab === 'pay'">
      <div class="panel">
        <div class="field-group">
          <label class="form-label">طرف پرداخت</label>
          <select v-model="payParty" class="field">
            <option value="OWNER">مالک</option>
            <option v-if="hasTenant(unit) || summary.tenantCharge > 0" value="TENANT">مستأجر</option>
            <option value="UNIT">واحد (بدون تفکیک)</option>
          </select>
        </div>
        <div class="field-group mt-3">
          <label class="form-label">مبلغ (تومان)</label>
          <div class="d-flex gap-2">
            <input v-model="payAmount" class="field flex-grow-1" inputmode="numeric" placeholder="مبلغ دریافت" />
            <button class="ghost-btn" type="button" @click="fillRemaining">مانده</button>
          </div>
        </div>
        <div class="d-flex gap-2 mt-3">
          <button class="primary-btn flex-grow-1" type="button" :disabled="parseAmount(payAmount) <= 0" @click="savePayment">
            <AppIcon :name="editingPaymentId ? 'check-lg' : 'plus-lg'" size="sm" />
            {{ editingPaymentId ? 'ذخیره دریافت' : 'ثبت دریافت' }}
          </button>
          <button v-if="editingPaymentId" class="ghost-btn" type="button" @click="resetPaymentForm">
            <AppIcon name="x-lg" size="sm" />
            انصراف
          </button>
        </div>
      </div>

      <div class="stack">
        <div class="d-flex gap-2">
          <button class="ghost-btn flex-grow-1" type="button" @click="togglePaid('OWNER')">
            {{ summary.ownerRemaining <= 0 && summary.ownerCharge > 0 ? 'لغو تسویه مالک' : 'تسویه مالک' }}
          </button>
          <button
            v-if="hasTenant(unit) || summary.tenantCharge > 0"
            class="ghost-btn flex-grow-1"
            type="button"
            @click="togglePaid('TENANT')"
          >
            {{ summary.tenantRemaining <= 0 && summary.tenantCharge > 0 ? 'لغو تسویه مستأجر' : 'تسویه مستأجر' }}
          </button>
        </div>
        <button class="ghost-btn w-100" type="button" @click="togglePaid()">
          {{ summary.charge === 0 ? 'بدون شارژ' : summary.remaining <= 0 ? 'لغو تسویه کل واحد' : 'تسویه کل واحد' }}
        </button>
      </div>

      <div v-if="!receipts.length" class="panel empty">هنوز دریافتی برای این ماه ثبت نشده است.</div>
      <div v-else class="panel">
        <div v-for="payment in receipts" :key="payment.id" class="receipt-row">
          <div>
            <strong>{{ formatToman(payment.amount) }} تومان</strong>
            <small class="d-block text-muted">
              {{ receiptPartyLabel(payment.party) }} · {{ formatFaDate(payment.createdAt) }}
            </small>
          </div>
          <div class="d-flex gap-1">
            <button class="ghost-btn icon-action" type="button" aria-label="ویرایش" @click="startEdit(payment)">
              <AppIcon name="pencil" size="sm" />
              <span class="action-label">ویرایش</span>
            </button>
            <button class="danger-btn icon-action" type="button" aria-label="حذف" @click="onRemovePayment(payment.id)">
              <AppIcon name="trash" size="sm" />
              <span class="action-label">حذف</span>
            </button>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="tab === 'split'">
      <div v-if="!summary.breakdown.length" class="panel empty">برای این ماه هزینه‌ای به این واحد نخورده است.</div>
      <div v-else class="panel">
        <div v-for="row in summary.breakdown" :key="row.expense.id" class="split-row">
          <span>
            {{ row.expense.category }} · {{ row.expense.title }}
            <small class="text-muted">
              ({{ splitLabel(row.expense) }} · {{ natureLabel(row.expense.nature) }} · {{ partyLabel(row.payer) }})
            </small>
          </span>
          <span>{{ formatToman(row.share) }}</span>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="field-group">
        <label class="form-label">مالک</label>
        <input v-model="owner" class="field" type="text" placeholder="نام مالک" />
      </div>
      <div class="field-group">
        <label class="form-label">مستأجر</label>
        <input v-model="tenant" class="field" type="text" placeholder="خالی = مالک‌نشین" />
      </div>
      <div class="field-group">
        <label class="form-label">مسئول هزینه جاری</label>
        <select v-model="currentPayer" class="field">
          <option value="TENANT">مستأجر / استفاده‌کننده</option>
          <option value="OWNER">مالک</option>
        </select>
      </div>
      <div class="field-group">
        <label class="form-label">مسئول هزینه اساسی</label>
        <select v-model="capitalPayer" class="field">
          <option value="OWNER">مالک</option>
          <option value="TENANT">مستأجر (اگر اجاره‌نامه چنین گفته باشد)</option>
        </select>
      </div>
      <div class="field-group">
        <label class="form-label">متراژ اختصاصی (مترمربع)</label>
        <input v-model="areaText" class="field" inputmode="decimal" />
      </div>
      <div class="field-group">
        <label class="form-label">تعداد ساکنان دائم</label>
        <input v-model="residentsText" class="field" inputmode="numeric" />
      </div>
      <div class="field-group">
        <label class="form-label">نفرشب مهمان {{ periodLabel(store.state.currentPeriod) }}</label>
        <input v-model="guestNightsText" class="field" inputmode="numeric" placeholder="مثلاً ۲۰" />
        <small class="text-muted">
          معادل این ماه {{ formatPeople(occupancyDraft) }} نفر
          <template v-if="guestNightsDraft > 0">
            ({{ formatPeople(guestEquivalentDraft) }} مهمان)
          </template>
          — فقط روی هزینه نفری اثر دارد.
        </small>
      </div>
      <label class="form-check">
        <input v-model="hasParking" class="form-check-input" type="checkbox" />
        <span class="form-check-label">دارای حق استفاده از پارکینگ</span>
      </label>
      <div class="field-group">
        <label class="form-label">یادداشت</label>
        <textarea v-model="notes" class="field" rows="2" placeholder="مثلاً کولر روی بام دارد" />
      </div>
      <button class="primary-btn w-100" type="button" @click="saveUnit">
        <AppIcon name="check-lg" size="sm" />
        ذخیره واحد
      </button>
    </template>
  </div>
</template>
