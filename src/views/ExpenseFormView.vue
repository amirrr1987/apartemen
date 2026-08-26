<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import InfoTip from '../components/InfoTip.vue'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'
import { COST_NATURES, COST_TYPES, inferNature, natureLabel, payerFor, partyLabel } from '../data/defaults'
import { amountInWords, formatToman, parseAmount } from '../lib/format'
import { useAppStore } from '../stores/app'
import type { CostNature, CostType } from '../types'

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const { notify } = useToast()
const { confirm } = useConfirm()

const expenseId = computed(() => (route.params.id ? String(route.params.id) : undefined))
const existing = computed(() =>
  expenseId.value ? store.state.expenses.find((item) => item.id === expenseId.value) : undefined,
)
const isEdit = computed(() => Boolean(existing.value))

const type = ref<CostType>('AREA')
const nature = ref<CostNature>('CURRENT')
const title = ref('')
const amountText = ref('')
const notes = ref('')
const unitId = ref(store.state.units[0]?.id ?? 1)
const meters = ref<Record<number, string>>(
  Object.fromEntries(store.state.units.map((unit) => [unit.id, ''])),
)

function hydrate() {
  const expense = existing.value
  type.value = expense?.type ?? 'AREA'
  nature.value = expense?.nature ?? 'CURRENT'
  title.value = expense?.title ?? ''
  amountText.value = expense ? String(expense.amount) : ''
  notes.value = expense?.notes ?? ''
  unitId.value = expense?.unitId ?? store.state.units[0]?.id ?? 1
  meters.value = Object.fromEntries(
    store.state.units.map((unit) => [
      unit.id,
      expense?.meters?.[unit.id] != null ? String(expense.meters[unit.id]) : '',
    ]),
  )
}

onMounted(hydrate)
watch(expenseId, hydrate)

const selectedType = computed(() => COST_TYPES.find((item) => item.value === type.value)!)
const amount = computed(() => parseAmount(amountText.value))
const words = computed(() => amountInWords(amount.value))

const meterValues = computed(() => {
  const result: Record<number, number> = {}
  for (const unit of store.state.units) {
    result[unit.id] = parseAmount(meters.value[unit.id] ?? '')
  }
  return result
})

const split = computed(() => {
  if (amount.value <= 0) return null
  return store.previewSplit({
    amount: amount.value,
    type: type.value,
    nature: nature.value,
    unitId: type.value === 'UNIT' ? unitId.value : undefined,
    meters: type.value === 'METER' ? meterValues.value : undefined,
  })
})

const canSave = computed(() => title.value.trim().length > 0 && amount.value > 0)

watch(type, (next) => {
  if (isEdit.value) return
  nature.value = inferNature(title.value, next)
})

function useExample(example: { title: string; nature: CostNature }) {
  title.value = example.title
  nature.value = example.nature
}

function typeIcon(value: CostType) {
  if (value === 'AREA') return 'bounding-box'
  if (value === 'EQUAL') return 'grid-3x2'
  if (value === 'WATER') return 'droplet'
  if (value === 'PERSON') return 'people'
  if (value === 'UNIT') return 'house-door'
  return 'speedometer2'
}

function payload() {
  return {
    title: title.value,
    amount: amount.value,
    type: type.value,
    nature: nature.value,
    unitId: type.value === 'UNIT' ? unitId.value : undefined,
    meters: type.value === 'METER' ? meterValues.value : undefined,
    notes: notes.value,
  }
}

function save() {
  if (!canSave.value) return
  if (existing.value) {
    store.updateExpense(existing.value.id, payload())
    notify('هزینه ویرایش شد')
  } else {
    store.addExpense(payload())
    notify('هزینه ثبت شد')
  }
  void router.push('/expenses')
}

async function onDelete() {
  if (!existing.value) return
  if (!(await confirm('این هزینه حذف شود؟'))) return
  store.removeExpense(existing.value.id)
  notify('هزینه حذف شد')
  void router.push('/expenses')
}
</script>

<template>
  <p class="note info mb-3">
    اول نوع تقسیم را انتخاب کنید، بعد مبلغ را بزنید. پیش‌نمایش سهم هر واحد پایین فرم می‌آید.
  </p>

  <div class="d-flex align-items-center gap-2 mb-2">
    <label class="form-label mb-0">نوع تقسیم بین واحدها</label>
    <InfoTip text="این انتخاب فقط بین واحدها تقسیم می‌کند، نه بین مالک و مستأجر." />
  </div>
  <div class="type-grid mb-3">
    <button
      v-for="item in COST_TYPES"
      :key="item.value"
      class="type-btn"
      :class="{ active: type === item.value }"
      type="button"
      @click="type = item.value"
    >
      <AppIcon :name="typeIcon(item.value)" />
      <strong>{{ item.label }}</strong>
      <small>{{ item.hint }}</small>
    </button>
  </div>

  <label class="form-label">ماهیت هزینه (مالک یا مستأجر)</label>
  <div class="type-grid mb-2">
    <button
      v-for="item in COST_NATURES"
      :key="item.value"
      class="type-btn"
      :class="{ active: nature === item.value }"
      type="button"
      @click="nature = item.value"
    >
      <AppIcon :name="item.value === 'CAPITAL' ? 'tools' : 'lightning-charge'" />
      <strong>{{ item.label }}</strong>
      <small>{{ item.hint }}</small>
    </button>
  </div>

  <label class="form-label">عنوان</label>
  <input v-model="title" class="field mb-2" type="text" placeholder="مثلاً گاز موتورخانه" />
  <div class="quick-tags mb-3">
    <button v-for="example in selectedType.examples" :key="example.title" type="button" @click="useExample(example)">
      {{ example.title }}
    </button>
  </div>

  <label class="form-label">مبلغ (تومان)</label>
  <input v-model="amountText" class="field" inputmode="numeric" placeholder="مثلاً ۱۲۰۰۰۰۰" />
  <small v-if="words" class="text-muted d-block mb-3">{{ words }}</small>
  <small v-else class="d-block mb-3">&nbsp;</small>

  <div v-if="type === 'UNIT'" class="mb-3">
    <label class="form-label">واحد مسئول</label>
    <select v-model.number="unitId" class="field">
      <option v-for="unit in store.state.units" :key="unit.id" :value="unit.id">{{ unit.name }}</option>
    </select>
  </div>

  <div v-if="type === 'METER'" class="mb-3">
    <label class="form-label">عدد کنتور هر واحد</label>
    <div v-for="unit in store.state.units" :key="unit.id" class="d-flex align-items-center gap-2 mb-2">
      <span class="flex-grow-1">{{ unit.name }}</span>
      <input v-model="meters[unit.id]" class="field" style="max-width: 140px" inputmode="decimal" />
    </div>
  </div>

  <label class="form-label">یادداشت (اختیاری)</label>
  <textarea v-model="notes" class="field mb-3" rows="2" />

  <div v-if="split" class="panel mb-3">
    <strong class="d-block mb-2">پیش‌نمایش سهم واحدها · {{ natureLabel(nature) }}</strong>
    <div v-for="unit in store.state.units" :key="unit.id" class="split-row">
      <span>
        {{ unit.name }}
        <small class="text-muted">({{ partyLabel(payerFor(unit, nature)) }})</small>
      </span>
      <span>{{ formatToman(split[unit.id] ?? 0) }} تومان</span>
    </div>
  </div>

  <button class="primary-btn w-100" type="button" :disabled="!canSave" @click="save">
    <AppIcon :name="isEdit ? 'check-lg' : 'plus-lg'" size="sm" />
    {{ isEdit ? 'ذخیره تغییرات' : 'ثبت هزینه' }}
  </button>
  <button v-if="isEdit" class="danger-btn w-100 mt-2" type="button" @click="onDelete">
    <AppIcon name="trash" size="sm" />
    حذف هزینه
  </button>
</template>
