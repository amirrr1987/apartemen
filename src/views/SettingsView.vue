<script setup lang="ts">
import { useClipboard, useFileDialog } from '@vueuse/core'
import AppIcon from '../components/AppIcon.vue'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const { notify } = useToast()
const { confirm } = useConfirm()
const { copy } = useClipboard()
const { open, onChange } = useFileDialog({ accept: 'application/json', multiple: false })

function syncWater(which: 'equal' | 'person', value: number) {
  const n = Math.min(100, Math.max(0, Math.round(value)))
  if (which === 'equal') {
    store.state.settings.waterEqualPercent = n
    store.state.settings.waterPersonPercent = 100 - n
  } else {
    store.state.settings.waterPersonPercent = n
    store.state.settings.waterEqualPercent = 100 - n
  }
}

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
  if (!(await confirm('همه هزینه‌ها و پرداخت‌ها پاک شود؟ واحدها به حالت اولیه برمی‌گردند.'))) return
  store.resetAll()
  notify('اطلاعات بازنشانی شد')
}
</script>

<template>
  <label class="form-label">نام ساختمان</label>
  <input v-model="store.state.settings.buildingName" class="field mb-3" type="text" />

  <label class="form-label">
    آب بدون کنتور: {{ store.state.settings.waterEqualPercent.toLocaleString('fa-IR') }}٪ مساوی
    +
    {{ store.state.settings.waterPersonPercent.toLocaleString('fa-IR') }}٪ نفری
  </label>
  <input
    class="form-range mb-3"
    type="range"
    min="0"
    max="100"
    :value="store.state.settings.waterEqualPercent"
    @input="syncWater('equal', Number(($event.target as HTMLInputElement).value))"
  />

  <label class="form-label">حق‌الزحمه مصوب مدیر (تومان)</label>
  <input
    class="field mb-2"
    type="number"
    min="0"
    :value="store.state.settings.managerFee || ''"
    @input="store.state.settings.managerFee = Number(($event.target as HTMLInputElement).value) || 0"
  />
  <p class="text-muted small">پرداخت فقط با تصویب مجمع معتبر است و باید جدا از شارژ ثبت شود.</p>
  <button class="ghost-btn w-100 mb-3" type="button" @click="onManagerFee">
    <AppIcon name="person-badge" size="sm" />
    ثبت حق‌الزحمه این ماه
  </button>

  <div class="d-grid gap-2">
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
</template>
