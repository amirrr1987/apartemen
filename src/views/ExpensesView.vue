<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'
import { COST_TYPES, natureLabel, parkingScopeLabel } from '../data/defaults'
import { formatToman } from '../lib/format'
import { periodLabel } from '../lib/jalali'
import { useAppStore } from '../stores/app'
import type { CostType } from '../types'

const store = useAppStore()
const router = useRouter()
const { notify } = useToast()
const { confirm } = useConfirm()

const query = ref('')
const deferred = ref('')
const filter = ref<CostType | 'ALL'>('ALL')
const categoryFilter = ref<string>('ALL')
const applyQuery = useDebounceFn((value: string) => {
  deferred.value = value.trim()
}, 180)

const filtered = computed(() =>
  store.periodExpenses.filter((expense) => {
    if (filter.value !== 'ALL' && expense.type !== filter.value) return false
    if (categoryFilter.value !== 'ALL' && expense.category !== categoryFilter.value) return false
    if (!deferred.value) return true
    return (
      expense.title.includes(deferred.value) ||
      expense.category.includes(deferred.value) ||
      expense.notes.includes(deferred.value)
    )
  }),
)

function typeIcon(value: CostType) {
  if (value === 'AREA') return 'bounding-box'
  if (value === 'EQUAL') return 'grid-3x2'
  if (value === 'PERSON') return 'people'
  return 'house-door'
}

function typeLabel(type: CostType) {
  return COST_TYPES.find((item) => item.value === type)?.label ?? type
}

function typeClass(type: CostType) {
  if (type === 'AREA') return ''
  if (type === 'EQUAL') return 'muted'
  if (type === 'PERSON') return 'accent'
  return 'ok'
}

async function onRemove(id: string) {
  if (!(await confirm('این هزینه حذف شود؟'))) return
  store.removeExpense(id)
  notify('هزینه حذف شد')
}
</script>

<template>
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h2 class="h5 m-0">هزینه‌های {{ periodLabel(store.state.currentPeriod) }}</h2>
    <span class="chip">{{ store.periodExpenses.length.toLocaleString('fa-IR') }} مورد</span>
  </div>

  <div class="field-icon mb-2">
    <AppIcon name="search" size="sm" />
    <input
      class="field"
      type="search"
      :value="query"
      placeholder="جستجوی دسته، عنوان یا یادداشت"
      @input="query = ($event.target as HTMLInputElement).value; applyQuery(query)"
    />
  </div>

  <label class="form-label">دسته‌بندی</label>
  <div class="quick-tags mb-2">
    <button type="button" :class="{ active: categoryFilter === 'ALL' }" @click="categoryFilter = 'ALL'">همه</button>
    <button
      v-for="item in store.expenseCategories"
      :key="item"
      type="button"
      :class="{ active: categoryFilter === item }"
      @click="categoryFilter = item"
    >
      {{ item }}
    </button>
  </div>

  <label class="form-label">نوع تقسیم</label>
  <div class="quick-tags mb-3">
    <button type="button" :class="{ active: filter === 'ALL' }" @click="filter = 'ALL'">همه</button>
    <button
      v-for="item in COST_TYPES"
      :key="item.value"
      type="button"
      :class="{ active: filter === item.value }"
      @click="filter = item.value"
    >
      {{ item.label }}
    </button>
  </div>

  <div v-if="!store.periodExpenses.length" class="panel empty">
    <p class="mb-2">هزینه‌ای در این ماه نیست.</p>
    <RouterLink class="primary-btn" to="/expenses/new">
      <AppIcon name="plus-lg" size="sm" />
      افزودن هزینه
    </RouterLink>
  </div>
  <div v-else-if="!filtered.length" class="panel empty">نتیجه‌ای برای این جستجو نیست.</div>

  <article v-for="expense in filtered" :key="expense.id" class="panel mb-2">
    <div class="d-flex justify-content-between gap-2">
      <button class="expense-open" type="button" @click="router.push(`/expenses/${expense.id}`)">
        <div class="d-flex flex-wrap gap-1">
          <span class="chip accent">{{ expense.category }}</span>
          <span class="chip" :class="typeClass(expense.type)">
            <AppIcon :name="typeIcon(expense.type)" size="sm" />
            {{ typeLabel(expense.type) }}
          </span>
          <span class="chip" :class="expense.nature === 'CAPITAL' ? 'accent' : 'ok'">
            {{ natureLabel(expense.nature) }}
          </span>
          <span v-if="expense.parkingScope !== 'ALL'" class="chip muted">
            {{ parkingScopeLabel(expense.parkingScope) }}
          </span>
        </div>
        <h3 class="h6 mt-2 mb-1">{{ expense.title }}</h3>
        <small class="text-muted" v-if="expense.notes">{{ expense.notes }}</small>
      </button>
      <div class="text-end">
        <strong>{{ formatToman(expense.amount) }}</strong>
        <div class="d-flex justify-content-end gap-1 mt-2">
          <button
            class="ghost-btn icon-action"
            type="button"
            aria-label="ویرایش"
            @click="router.push(`/expenses/${expense.id}`)"
          >
            <AppIcon name="pencil" size="sm" />
            <span class="action-label">ویرایش</span>
          </button>
          <button
            class="danger-btn icon-action"
            type="button"
            aria-label="حذف"
            @click="onRemove(expense.id)"
          >
            <AppIcon name="trash" size="sm" />
            <span class="action-label">حذف</span>
          </button>
        </div>
      </div>
    </div>
  </article>
</template>
