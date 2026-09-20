<script setup lang="ts">
import { useClipboard, useFileDialog } from '@vueuse/core'
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'
import { parkingLabel } from '../data/defaults'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const router = useRouter()
const { notify } = useToast()
const { confirm } = useConfirm()
const { copy } = useClipboard()
const { open, onChange } = useFileDialog({ accept: 'application/json', multiple: false })

function onManagerFee() {
  if (store.state.settings.managerFee <= 0) {
    notify('ابتدا مبلغ مصوب را وارد کنید')
    return
  }
  notify(store.addManagerFee() ? 'حق‌الزحمه این ماه ثبت شد' : 'این ماه قبلاً ثبت شده است')
}

function onExport() {
  const blob = new Blob([store.exportBackup()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'aparteman-backup.json'
  a.click()
  URL.revokeObjectURL(url)
  notify('پشتیبان ذخیره شد')
}

async function copyBackup() {
  await copy(store.exportBackup())
  notify('پشتیبان در حافظه کپی شد')
}

onChange(async (files) => {
  const file = files?.[0]
  if (!file) return
  try {
    store.importBackup(await file.text())
    notify('اطلاعات بازیابی شد')
  } catch {
    notify('فایل پشتیبان نامعتبر است')
  }
})

async function onReset() {
  if (!(await confirm('همه داده‌ها پاک شود و تعریف اولیه از نو انجام شود؟'))) return
  store.resetAll()
  notify('اطلاعات بازنشانی شد')
  void router.replace('/setup')
}

async function onRemoveUnit(id: number) {
  if (!(await confirm('این واحد حذف شود؟'))) return
  if (!store.removeUnit(id)) {
    notify('حداقل یک واحد باید باقی بماند')
    return
  }
  notify('واحد حذف شد')
}
</script>

<template>
  <div class="page">
    <div class="field-group">
      <label class="form-label">نام ساختمان</label>
      <input v-model="store.state.settings.buildingName" class="field" type="text" />
    </div>

    <div>
      <div class="d-flex justify-content-between align-items-center mb-3">
        <label class="form-label mb-0">واحدها</label>
        <button class="ghost-btn py-1 px-3" type="button" @click="store.addUnit()">
          <AppIcon name="plus-lg" size="sm" />
          واحد جدید
        </button>
      </div>
      <div class="stack">
        <div v-for="unit in store.state.units" :key="unit.id" class="unit-row">
          <button class="expense-open" type="button" @click="router.push(`/units/${unit.id}`)">
            <strong>{{ unit.name }}</strong>
            <small class="d-block text-muted">{{ unit.area }} متر · {{ parkingLabel(unit) }}</small>
          </button>
          <button
            v-if="store.state.units.length > 1"
            class="ghost-btn icon-action"
            type="button"
            aria-label="حذف"
            @click="onRemoveUnit(unit.id)"
          >
            <AppIcon name="trash" size="sm" />
          </button>
        </div>
      </div>
    </div>

    <div>
      <label class="form-label">حق‌الزحمه مصوب مدیر (تومان)</label>
      <input
        class="field"
        type="number"
        min="0"
        :value="store.state.settings.managerFee || ''"
        @input="store.state.settings.managerFee = Number(($event.target as HTMLInputElement).value) || 0"
      />
      <p class="text-muted small mt-2 mb-3">فقط با تصویب مجمع معتبر است و جدا از شارژ ثبت می‌شود.</p>
      <button class="ghost-btn w-100" type="button" @click="onManagerFee">
        <AppIcon name="person-badge" size="sm" />
        ثبت حق‌الزحمه این ماه
      </button>
    </div>

    <div class="settings-actions">
      <button class="ghost-btn" type="button" @click="router.push('/setup')">
        <AppIcon name="gear-wide-connected" size="sm" />
        ویرایش تعریف اولیه
      </button>
      <button class="primary-btn" type="button" @click="onExport">
        <AppIcon name="download" size="sm" />
        دانلود پشتیبان
      </button>
      <button class="ghost-btn" type="button" @click="copyBackup">
        <AppIcon name="clipboard" size="sm" />
        کپی پشتیبان
      </button>
      <button class="ghost-btn" type="button" @click="open()">
        <AppIcon name="upload" size="sm" />
        بازیابی از فایل
      </button>
      <button class="danger-btn" type="button" @click="onReset">
        <AppIcon name="arrow-counterclockwise" size="sm" />
        بازنشانی همه داده‌ها
      </button>
    </div>
  </div>
</template>
