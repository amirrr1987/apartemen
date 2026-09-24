<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'
import { COST_TYPES, clampPersonWeight } from '../data/defaults'
import { formatToman } from '../lib/format'
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

function typeLabel(type: CostType) {
  return COST_TYPES.find((item) => item.value === type)?.label ?? type
}

function expenseTypeLabel(expense: { type: CostType; personWeight?: number }) {
  const base = typeLabel(expense.type)
  if (expense.type !== 'HYBRID') return base
  const person = Math.round(clampPersonWeight(expense.personWeight) * 100)
  return `${base} · ${person}٪ نفر`
}

async function onRemove(id: string) {
  if (!(await confirm('این هزینه حذف شود؟'))) return
  store.removeExpense(id)
  notify('هزینه حذف شد')
}
</script>

<template>
  <div class="page">
    <div class="field-icon">
      <AppIcon name="search" size="sm" />
      <input
        class="field"
        type="search"
        :value="query"
        placeholder="جستجوی هزینه"
        aria-label="جستجوی هزینه"
        @input="query = ($event.target as HTMLInputElement).value; applyQuery(query)"
      />
    </div>

    <div>
      <div class="filter-block">
        <label class="form-label">دسته‌بندی</label>
        <div class="quick-tags">
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
      </div>
      <div class="filter-block">
        <label class="form-label">نوع تقسیم</label>
        <div class="quick-tags">
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
      </div>
    </div>

    <div v-if="!store.periodExpenses.length" class="panel empty">
      <p class="mb-0">هزینه‌ای در این ماه نیست.</p>
      <RouterLink class="primary-btn" to="/expenses/new">
        <AppIcon name="plus-lg" size="sm" />
        افزودن هزینه
      </RouterLink>
    </div>
    <div v-else-if="!filtered.length" class="panel empty">نتیجه‌ای برای این جستجو نیست.</div>

    <div v-else class="stack">
      <article v-for="expense in filtered" :key="expense.id" class="panel expense-card">
        <button class="expense-open" type="button" @click="router.push(`/expenses/${expense.id}`)">
          <span class="eyebrow">{{ expense.category }} · {{ expenseTypeLabel(expense) }}</span>
          <h3>{{ expense.title }}</h3>
          <small v-if="expense.notes" class="text-muted">{{ expense.notes }}</small>
        </button>
        <div class="unit-aside">
          <div class="unit-amount">{{ formatToman(expense.amount) }}</div>
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
      </article>
    </div>
  </div>
</template>
