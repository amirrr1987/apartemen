<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import InfoTip from '../components/InfoTip.vue'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'
import {
  COST_NATURES,
  COST_TYPES,
  PARKING_SCOPES,
  catalogItemsForCategory,
  inferNature,
  inferParkingScope,
  natureLabel,
  payerFor,
  partyLabel,
  parkingScopeLabel,
} from '../data/defaults'
import type { ExpenseCatalogItem } from '../data/defaults'
import { amountInWords, formatToman, parseAmount } from '../lib/format'
import { useAppStore } from '../stores/app'
import type { CostNature, CostType, ParkingScope } from '../types'

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
const parkingScope = ref<ParkingScope>('ALL')
const category = ref(store.expenseCategories[0] ?? 'موتورخانه')
const title = ref('')
const amountText = ref('')
const notes = ref('')
const unitId = ref(store.state.units[0]?.id ?? 1)

function hydrate() {
  const expense = existing.value
  type.value = expense?.type ?? 'AREA'
  nature.value = expense?.nature ?? 'CURRENT'
  parkingScope.value = expense?.parkingScope ?? 'ALL'
  category.value = expense?.category ?? store.expenseCategories[0] ?? 'موتورخانه'
  title.value = expense?.title ?? ''
  amountText.value = expense ? String(expense.amount) : ''
  notes.value = expense?.notes ?? ''
  unitId.value = expense?.unitId ?? store.state.units[0]?.id ?? 1
}

onMounted(hydrate)
watch(expenseId, hydrate)

const titleSuggestions = computed(() => catalogItemsForCategory(category.value))
const amount = computed(() => parseAmount(amountText.value))
const words = computed(() => amountInWords(amount.value))

const split = computed(() => {
  if (amount.value <= 0) return null
  return store.previewSplit({
    amount: amount.value,
    type: type.value,
    nature: nature.value,
    unitId: type.value === 'UNIT' ? unitId.value : undefined,
    parkingScope: type.value === 'UNIT' ? 'ALL' : parkingScope.value,
    category: category.value,
    title: title.value,
  })
})

const canSave = computed(() => category.value.trim().length > 0 && title.value.trim().length > 0 && amount.value > 0)

watch(type, (next) => {
  if (isEdit.value) return
  nature.value = inferNature(title.value, next)
})

watch(title, (next) => {
  if (isEdit.value || type.value === 'UNIT') return
  parkingScope.value = inferParkingScope(next)
})

function selectCategory(next: string) {
  category.value = next
  if (!isEdit.value && !titleSuggestions.value.some((item) => item.title === title.value)) {
    title.value = ''
  }
}

function useCatalogItem(item: ExpenseCatalogItem) {
  title.value = item.title
  type.value = item.type
  nature.value = item.nature
  if (item.parkingScope) parkingScope.value = item.parkingScope
}

function typeIcon(value: CostType) {
  if (value === 'AREA') return 'bounding-box'
  if (value === 'EQUAL') return 'grid-3x2'
  if (value === 'PERSON') return 'people'
  return 'house-door'
}

function payload() {
  return {
    category: category.value,
    title: title.value,
    amount: amount.value,
    type: type.value,
    nature: nature.value,
    unitId: type.value === 'UNIT' ? unitId.value : undefined,
    parkingScope: type.value === 'UNIT' ? 'ALL' : parkingScope.value,
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
    ابتدا دسته‌بندی و عنوان را از لیست انتخاب کنید، سپس نوع تقسیم و مبلغ را وارد کنید.
  </p>

  <label class="form-label">دسته‌بندی</label>
  <div class="quick-tags mb-3">
    <button
      v-for="item in store.expenseCategories"
      :key="item"
      type="button"
      class="category-tag"
      :class="{ active: category === item }"
      @click="selectCategory(item)"
    >
      {{ item }}
    </button>
  </div>

  <label class="form-label">عنوان</label>
  <div v-if="titleSuggestions.length" class="quick-tags mb-2">
    <button
      v-for="item in titleSuggestions"
      :key="item.title"
      type="button"
      :class="{ active: title === item.title }"
      @click="useCatalogItem(item)"
    >
      {{ item.title }}
    </button>
  </div>
  <input v-model="title" class="field mb-3" type="text" placeholder="یا عنوان دلخواه بنویسید" />

  <div class="d-flex align-items-center gap-2 mb-2">
    <label class="form-label mb-0">نوع تقسیم بین واحدها</label>
    <InfoTip text="مبنای قانونی: متراژی (ماده ۴)، مساوی برای هزینه‌های غیرمرتبط با متراژ، نفری برای مصرف." />
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

  <template v-if="type !== 'UNIT'">
    <label class="form-label">مشمولیت پارکینگ</label>
    <div class="type-grid mb-3">
      <button
        v-for="item in PARKING_SCOPES"
        :key="item.value"
        class="type-btn"
        :class="{ active: parkingScope === item.value }"
        type="button"
        @click="parkingScope = item.value"
      >
        <AppIcon :name="item.value === 'WITH_PARKING' ? 'car-front' : item.value === 'WITHOUT_PARKING' ? 'car-front-fill' : 'buildings'" />
        <strong>{{ item.label }}</strong>
        <small>{{ item.hint }}</small>
      </button>
    </div>
  </template>

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

  <label class="form-label">یادداشت (اختیاری)</label>
  <textarea v-model="notes" class="field mb-3" rows="2" />

  <div v-if="split" class="panel mb-3">
    <strong class="d-block mb-2">
      پیش‌نمایش · {{ category }} · {{ natureLabel(nature) }}
      <span v-if="type !== 'UNIT'" class="text-muted"> · {{ parkingScopeLabel(parkingScope) }}</span>
    </strong>
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

<style scoped>
.category-tag.active {
  background: var(--primary-soft);
  color: var(--primary-dark);
  border-color: var(--primary);
}
</style>
