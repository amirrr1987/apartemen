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
  DEFAULT_PERSON_WEIGHT,
  PARKING_SCOPES,
  PERSON_WEIGHT_PRESETS,
  catalogItemsForCategory,
  clampPersonWeight,
  costTypeLabel,
  inferNature,
  inferParkingScope,
  natureLabel,
  payerFor,
  partyLabel,
  parkingScopeLabel,
  recommendSplit,
} from '../data/defaults'
import type { ExpenseCatalogItem } from '../data/defaults'
import { amountInWords, formatPeople, formatToman, parseAmount } from '../lib/format'
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
const personPercent = ref(Math.round(DEFAULT_PERSON_WEIGHT * 100))
const advancedOpen = ref(false)
const manualSplit = ref(false)
const recommendReason = ref('')

function applyRecommendation(force = false) {
  if (isEdit.value && !force) return
  if (manualSplit.value && !force) return
  const rec = recommendSplit(category.value, title.value)
  type.value = rec.type
  nature.value = rec.nature
  parkingScope.value = rec.parkingScope
  recommendReason.value = rec.reason
  if (rec.type === 'HYBRID') {
    personPercent.value = Math.round(clampPersonWeight(rec.personWeight) * 100)
  }
}

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
  personPercent.value = Math.round(clampPersonWeight(expense?.personWeight) * 100)
  advancedOpen.value = false
  manualSplit.value = Boolean(expense)
  recommendReason.value = expense
    ? COST_TYPES.find((item) => item.value === expense.type)?.hint ?? ''
    : ''
  if (!expense) applyRecommendation(true)
}

onMounted(hydrate)
watch(expenseId, hydrate)

const titleSuggestions = computed(() => catalogItemsForCategory(category.value))
const amount = computed(() => parseAmount(amountText.value))
const words = computed(() => amountInWords(amount.value))
const personWeight = computed(() => clampPersonWeight(personPercent.value / 100))
const areaPercent = computed(() => 100 - personPercent.value)
const typeMeta = computed(() => COST_TYPES.find((item) => item.value === type.value))

const split = computed(() => {
  if (amount.value <= 0) return null
  return store.previewSplit({
    amount: amount.value,
    type: type.value,
    nature: nature.value,
    unitId: type.value === 'UNIT' ? unitId.value : undefined,
    parkingScope: type.value === 'UNIT' ? 'ALL' : parkingScope.value,
    personWeight: type.value === 'HYBRID' ? personWeight.value : undefined,
    category: category.value,
    title: title.value,
  })
})

const canSave = computed(() => category.value.trim().length > 0 && title.value.trim().length > 0 && amount.value > 0)

watch([category, title], () => {
  if (!isEdit.value) applyRecommendation()
})

watch(type, (next) => {
  if (isEdit.value && manualSplit.value) return
  if (!manualSplit.value) nature.value = inferNature(title.value, next)
})

function selectCategory(next: string) {
  category.value = next
  if (!isEdit.value && !titleSuggestions.value.some((item) => item.title === title.value)) {
    title.value = ''
    manualSplit.value = false
  }
}

function useCatalogItem(item: ExpenseCatalogItem) {
  title.value = item.title
  manualSplit.value = false
  type.value = item.type
  nature.value = item.nature
  parkingScope.value = item.parkingScope ?? inferParkingScope(item.title)
  recommendReason.value = COST_TYPES.find((row) => row.value === item.type)?.hint ?? ''
  if (item.type === 'HYBRID') personPercent.value = Math.round(DEFAULT_PERSON_WEIGHT * 100)
}

function chooseType(next: CostType) {
  manualSplit.value = true
  type.value = next
  nature.value = inferNature(title.value, next)
  if (next !== 'UNIT') parkingScope.value = inferParkingScope(title.value)
  recommendReason.value = COST_TYPES.find((item) => item.value === next)?.hint ?? ''
  if (next === 'HYBRID') personPercent.value = Math.round(DEFAULT_PERSON_WEIGHT * 100)
}

function typeIcon(value: CostType) {
  if (value === 'AREA') return 'bounding-box'
  if (value === 'EQUAL') return 'grid-3x2'
  if (value === 'PERSON') return 'people'
  if (value === 'HYBRID') return 'pie-chart'
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
    personWeight: type.value === 'HYBRID' ? personWeight.value : undefined,
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
  <div class="page">
    <p class="note">عنوان و مبلغ را بزنید؛ روش تقسیم پیشنهاد می‌شود. تنظیمات بیشتر اختیاری است.</p>

    <div class="field-group">
      <label class="form-label">دسته‌بندی</label>
      <div class="quick-tags">
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
    </div>

    <div class="field-group">
      <label class="form-label">عنوان</label>
      <div v-if="titleSuggestions.length" class="quick-tags">
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
      <input v-model="title" class="field" type="text" placeholder="یا عنوان دلخواه بنویسید" />
    </div>

    <div class="field-group">
      <label class="form-label">مبلغ (تومان)</label>
      <input v-model="amountText" class="field" inputmode="numeric" placeholder="مثلاً ۱۲۰۰۰۰۰" />
      <small v-if="words" class="text-muted">{{ words }}</small>
    </div>

    <div class="field-group">
      <div class="d-flex align-items-center gap-2 mb-2">
        <label class="form-label mb-0">روش تقسیم</label>
        <InfoTip text="پیشنهاد بر اساس عنوان و دسته است. برای بیشتر هزینه‌ها نیازی به تغییر نیست." />
      </div>
      <div class="recommend-card">
        <p class="recommend-card__title">
          <AppIcon :name="typeIcon(type)" size="sm" />
          {{ costTypeLabel(type) }}
          <span v-if="type === 'HYBRID'" class="text-muted">· {{ personPercent }}٪ نفر</span>
        </p>
        <p class="recommend-card__reason">{{ recommendReason || typeMeta?.hint }}</p>
        <button class="ghost-btn w-100" type="button" @click="advancedOpen = !advancedOpen">
          <AppIcon :name="advancedOpen ? 'chevron-up' : 'sliders'" size="sm" />
          {{ advancedOpen ? 'بستن تنظیمات' : 'تغییر روش و تنظیمات پیشرفته' }}
        </button>
      </div>
    </div>

    <div v-if="type === 'UNIT' && !advancedOpen" class="field-group">
      <label class="form-label">واحد مسئول</label>
      <select v-model.number="unitId" class="field">
        <option v-for="unit in store.state.units" :key="unit.id" :value="unit.id">{{ unit.name }}</option>
      </select>
    </div>

    <div v-if="advancedOpen" class="stack" style="margin-bottom: 16px">
      <div class="field-group">
        <label class="form-label">انتخاب روش</label>
        <div class="type-grid">
          <button
            v-for="item in COST_TYPES"
            :key="item.value"
            class="type-btn"
            :class="{ active: type === item.value }"
            type="button"
            @click="chooseType(item.value)"
          >
            <AppIcon :name="typeIcon(item.value)" />
            <strong>{{ item.label }}</strong>
            <small>{{ item.hint }}</small>
          </button>
        </div>
      </div>

      <div v-if="type === 'HYBRID'" class="field-group">
        <div class="d-flex align-items-center gap-2">
          <label class="form-label mb-0">وزن ترکیبی</label>
          <InfoTip text="سهم = α×نفری + (۱−α)×متراژی. مهمان فقط روی بخش نفری اثر دارد." />
        </div>
        <p class="hybrid-summary">{{ personPercent }}٪ نفری · {{ areaPercent }}٪ متراژی</p>
        <input
          v-model.number="personPercent"
          class="hybrid-range"
          type="range"
          min="0"
          max="100"
          step="5"
          aria-label="درصد سهم نفری"
          @change="manualSplit = true"
        />
        <div class="quick-tags">
          <button
            v-for="preset in PERSON_WEIGHT_PRESETS"
            :key="preset.personPercent"
            type="button"
            :class="{ active: personPercent === preset.personPercent }"
            @click="personPercent = preset.personPercent; manualSplit = true"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <div class="field-group">
        <label class="form-label">ماهیت هزینه (مالک یا مستأجر)</label>
        <div class="type-grid">
          <button
            v-for="item in COST_NATURES"
            :key="item.value"
            class="type-btn"
            :class="{ active: nature === item.value }"
            type="button"
            @click="nature = item.value; manualSplit = true"
          >
            <AppIcon :name="item.value === 'CAPITAL' ? 'tools' : 'lightning-charge'" />
            <strong>{{ item.label }}</strong>
            <small>{{ item.hint }}</small>
          </button>
        </div>
      </div>

      <div v-if="type !== 'UNIT'" class="field-group">
        <label class="form-label">مشمولیت پارکینگ</label>
        <div class="type-grid">
          <button
            v-for="item in PARKING_SCOPES"
            :key="item.value"
            class="type-btn"
            :class="{ active: parkingScope === item.value }"
            type="button"
            @click="parkingScope = item.value; manualSplit = true"
          >
            <AppIcon
              :name="item.value === 'WITH_PARKING' ? 'car-front' : item.value === 'WITHOUT_PARKING' ? 'car-front-fill' : 'buildings'"
            />
            <strong>{{ item.label }}</strong>
            <small>{{ item.hint }}</small>
          </button>
        </div>
      </div>

      <div v-if="type === 'UNIT'" class="field-group">
        <label class="form-label">واحد مسئول</label>
        <select v-model.number="unitId" class="field" @change="manualSplit = true">
          <option v-for="unit in store.state.units" :key="unit.id" :value="unit.id">{{ unit.name }}</option>
        </select>
      </div>

      <div class="field-group">
        <label class="form-label">یادداشت (اختیاری)</label>
        <textarea v-model="notes" class="field" rows="2" />
      </div>
    </div>

    <div v-else class="field-group">
      <label class="form-label">یادداشت (اختیاری)</label>
      <textarea v-model="notes" class="field" rows="2" />
    </div>

    <div v-if="split" class="panel">
      <strong class="d-block mb-2">
        پیش‌نمایش سهم‌ها · {{ costTypeLabel(type) }} · {{ natureLabel(nature) }}
        <span v-if="type !== 'UNIT'" class="text-muted"> · {{ parkingScopeLabel(parkingScope) }}</span>
        <span v-if="type === 'HYBRID'" class="text-muted"> · {{ personPercent }}٪ نفر</span>
      </strong>
      <div v-for="unit in store.state.units" :key="unit.id" class="split-row">
        <span>
          {{ unit.name }}
          <small class="text-muted">
            ({{ partyLabel(payerFor(unit, nature)) }}
            <template v-if="type === 'PERSON' || type === 'HYBRID'">
              · {{ formatPeople(store.summaries.find((row) => row.unit.id === unit.id)?.occupancy ?? unit.residents) }} نفر
            </template>)
          </small>
        </span>
        <span>{{ formatToman(split[unit.id] ?? 0) }} تومان</span>
      </div>
    </div>

    <div class="stack">
      <button class="primary-btn w-100" type="button" :disabled="!canSave" @click="save">
        <AppIcon :name="isEdit ? 'check-lg' : 'plus-lg'" size="sm" />
        {{ isEdit ? 'ذخیره تغییرات' : 'ثبت هزینه' }}
      </button>
      <button v-if="isEdit" class="danger-btn w-100" type="button" @click="onDelete">
        <AppIcon name="trash" size="sm" />
        حذف هزینه
      </button>
    </div>
  </div>
</template>

<style scoped>
.category-tag.active {
  background: var(--primary-soft);
  color: var(--primary-dark);
  border-color: var(--primary);
}

.hybrid-summary {
  margin: 0 0 0.5rem;
  font-weight: 600;
  color: var(--text);
}

.hybrid-range {
  width: 100%;
  margin-bottom: 0.75rem;
  accent-color: var(--primary);
}
</style>
