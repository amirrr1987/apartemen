<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { useToast } from '../composables/useToast'
import { createEmptyUnit } from '../data/defaults'
import { parseAmount } from '../lib/format'
import { useAppStore } from '../stores/app'
import type { Unit } from '../types'

const store = useAppStore()
const router = useRouter()
const { notify } = useToast()

const step = ref(1)
const buildingName = ref(store.state.settings.buildingName)
const unitCount = ref(Math.max(1, store.state.units.length || 1))
const managerFee = ref(store.state.settings.managerFee ? String(store.state.settings.managerFee) : '')

type DraftUnit = Unit & { areaText: string; residentsText: string }

const drafts = ref<DraftUnit[]>([])

function syncDrafts() {
  const count = Math.min(50, Math.max(1, Math.round(unitCount.value) || 1))
  unitCount.value = count
  const existing = drafts.value
  drafts.value = Array.from({ length: count }, (_, index) => {
    const id = index + 1
    const prev = existing[index] ?? store.state.units[index] ?? createEmptyUnit(id)
    return {
      ...createEmptyUnit(id, prev.name),
      ...prev,
      id,
      areaText: String(prev.area || ''),
      residentsText: String(prev.residents || 1),
    }
  })
}

watch(unitCount, syncDrafts, { immediate: true })

const canNextStep1 = computed(() => buildingName.value.trim().length > 0 && unitCount.value >= 1)
const canFinish = computed(() =>
  drafts.value.every(
    (unit) => unit.name.trim().length > 0 && parseAmount(unit.areaText) > 0 && Number(unit.residentsText) >= 0,
  ),
)

function nextStep() {
  if (step.value === 1 && !canNextStep1.value) return
  step.value = Math.min(3, step.value + 1)
}

function prevStep() {
  step.value = Math.max(1, step.value - 1)
}

function finish() {
  if (!canFinish.value) {
    notify('نام، متراژ و ساکنان هر واحد را کامل کنید')
    return
  }

  const units: Unit[] = drafts.value.map((draft) => ({
    id: draft.id,
    name: draft.name.trim(),
    area: parseAmount(draft.areaText),
    residents: Math.max(0, Math.round(Number(draft.residentsText.replace(/[^\d]/g, '')) || 0)),
    hasParking: draft.hasParking,
    owner: draft.owner.trim(),
    tenant: draft.tenant.trim(),
    currentPayer: draft.currentPayer,
    capitalPayer: draft.capitalPayer,
    notes: draft.notes.trim(),
  }))

  const wasSetup = store.state.settings.setupComplete

  store.completeSetup({
    buildingName: buildingName.value,
    units,
    managerFee: parseAmount(managerFee.value),
  })

  notify(wasSetup ? 'تعریف ساختمان به‌روز شد' : 'تعریف اولیه ساختمان ذخیره شد')
  void router.replace('/')
}
</script>

<template>
  <div class="setup-screen">
    <div class="setup-card">
      <div class="setup-header">
        <div class="brand-mark">ش</div>
        <div>
          <h1>تعریف ساختمان</h1>
          <p>نام، تعداد واحد و متراژ را یک‌بار مشخص کنید.</p>
        </div>
      </div>

      <div class="setup-steps">
        <span :class="{ active: step >= 1 }">۱. ساختمان</span>
        <span :class="{ active: step >= 2 }">۲. واحدها</span>
        <span :class="{ active: step >= 3 }">۳. تأیید</span>
      </div>

      <div v-if="step === 1" class="page">
        <div class="field-group">
          <label class="form-label" for="building">نام ساختمان</label>
          <input id="building" v-model="buildingName" class="field" type="text" placeholder="مثلاً ساختمان نیلوفر" />
        </div>

        <div class="field-group">
          <label class="form-label" for="count">تعداد واحدها</label>
          <input
            id="count"
            v-model.number="unitCount"
            class="field"
            type="number"
            min="1"
            max="50"
            @change="syncDrafts"
          />
        </div>

        <div class="field-group">
          <label class="form-label" for="fee">حق‌الزحمه مصوب مدیر (اختیاری)</label>
          <input id="fee" v-model="managerFee" class="field" inputmode="numeric" placeholder="۰" />
        </div>

        <button class="primary-btn w-100" type="button" :disabled="!canNextStep1" @click="nextStep">
          ادامه
          <AppIcon name="chevron-left" size="sm" />
        </button>
      </div>

      <div v-else-if="step === 2" class="page">
        <p class="note">
          متراژ اختصاصی مبنای تقسیم متراژی است. پارکینگ فقط برای هزینه‌های مرتبط با پارکینگ اعمال می‌شود.
        </p>

        <article v-for="unit in drafts" :key="unit.id" class="unit-draft panel">
          <strong class="d-block mb-2">{{ unit.name }}</strong>

          <label class="form-label">نام واحد</label>
          <input v-model="unit.name" class="field mb-2" type="text" />

          <div class="row g-2 mb-2">
            <div class="col-6">
              <label class="form-label">متراژ (مترمربع)</label>
              <input v-model="unit.areaText" class="field" inputmode="decimal" />
            </div>
            <div class="col-6">
              <label class="form-label">ساکنان</label>
              <input v-model="unit.residentsText" class="field" inputmode="numeric" />
            </div>
          </div>

          <label class="form-check mb-2">
            <input v-model="unit.hasParking" class="form-check-input" type="checkbox" />
            <span class="form-check-label">دارای حق استفاده از پارکینگ</span>
          </label>

          <div class="row g-2">
            <div class="col-6">
              <label class="form-label">مالک</label>
              <input v-model="unit.owner" class="field" type="text" />
            </div>
            <div class="col-6">
              <label class="form-label">مستأجر</label>
              <input v-model="unit.tenant" class="field" type="text" placeholder="خالی = مالک‌نشین" />
            </div>
          </div>
        </article>

        <div class="d-flex gap-2">
          <button class="ghost-btn flex-grow-1" type="button" @click="prevStep">قبلی</button>
          <button class="primary-btn flex-grow-1" type="button" :disabled="!canFinish" @click="nextStep">
            ادامه
          </button>
        </div>
      </div>

      <div v-else class="page">
        <div class="panel">
          <p><strong>ساختمان:</strong> {{ buildingName }}</p>
          <p><strong>تعداد واحد:</strong> {{ drafts.length.toLocaleString('fa-IR') }}</p>
          <p>
            <strong>دارای پارکینگ:</strong>
            {{ drafts.filter((unit) => unit.hasParking).length.toLocaleString('fa-IR') }} واحد
          </p>
          <p><strong>مجموع متراژ:</strong> {{ drafts.reduce((sum, unit) => sum + parseAmount(unit.areaText), 0).toLocaleString('fa-IR') }} متر</p>
        </div>

        <div class="d-flex gap-2">
          <button class="ghost-btn flex-grow-1" type="button" @click="prevStep">ویرایش</button>
          <button class="primary-btn flex-grow-1" type="button" @click="finish">
            <AppIcon name="check-lg" size="sm" />
            شروع کار
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
