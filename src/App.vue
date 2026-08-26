<script setup lang="ts">
import { useNProgress } from '@vueuse/integrations/useNProgress'
import { useOnline } from '@vueuse/core'
import { gsap } from 'gsap'
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import AppIcon from './components/AppIcon.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import MonthSwitcher from './components/MonthSwitcher.vue'
import PWABadge from './components/PWABadge.vue'
import { usePageEnter } from './composables/usePageEnter'
import { usePwaInstall } from './composables/usePwaInstall'
import { useToast } from './composables/useToast'
import { useAppStore } from './stores/app'

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const online = useOnline()
const { message, notify } = useToast()
const { canInstall, showIosTip, install } = usePwaInstall()
const { start, done } = useNProgress()
const pageRoot = ref<HTMLElement | null>(null)
const toastEl = ref<HTMLElement | null>(null)

usePageEnter(pageRoot)

router.beforeEach(() => {
  start()
  return true
})
router.afterEach(() => {
  done()
})

watch(message, async (value) => {
  if (!value) return
  await nextTick()
  if (!toastEl.value) return
  gsap.fromTo(toastEl.value, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.28 })
})

const title = computed(() => store.state.settings.buildingName || 'ساختمان')
const showFab = computed(() => route.meta.fab === true)
const showBack = computed(() => ['expense-new', 'expense-edit', 'unit'].includes(String(route.name)))
const showPeriod = computed(() => route.name !== 'guide' && route.name !== 'settings')

const tabs = [
  { to: '/', name: 'home', icon: 'house', iconActive: 'house-fill', label: 'خانه' },
  { to: '/expenses', name: 'expenses', icon: 'receipt', iconActive: 'receipt', label: 'هزینه‌ها' },
  { to: '/payments', name: 'payments', icon: 'wallet2', iconActive: 'wallet-fill', label: 'پرداخت‌ها' },
  { to: '/report', name: 'report', icon: 'bar-chart', iconActive: 'bar-chart-fill', label: 'گزارش' },
  { to: '/settings', name: 'settings', icon: 'gear', iconActive: 'gear-fill', label: 'تنظیمات' },
  { to: '/guide', name: 'guide', icon: 'question-circle', iconActive: 'question-circle-fill', label: 'راهنما' },
] as const

function isTabActive(name: string) {
  if (name === 'home') return route.name === 'home'
  if (name === 'expenses') return String(route.name).startsWith('expense')
  if (name === 'payments') return route.name === 'payments' || route.name === 'unit'
  if (name === 'report') return route.name === 'report' || route.name === 'units'
  return route.name === name
}

async function installApp() {
  if (showIosTip.value && !canInstall.value) {
    notify('در Safari از اشتراک‌گذاری، Add to Home Screen را بزنید', 5000)
    return
  }
  const ok = await install()
  notify(ok ? 'برنامه روی دستگاه نصب شد' : 'نصب لغو شد')
}
</script>

<template>
  <div class="screen" :class="{ 'has-fab': showFab }">
    <header class="topbar">
      <div class="brand">
        <button v-if="showBack" class="icon-btn" type="button" aria-label="بازگشت" @click="router.back()">
          <AppIcon name="chevron-right" />
        </button>
        <div v-else class="brand-mark">ش</div>
        <div>
          <h1>{{ title }}</h1>
          <p>{{ (route.meta.title as string) || 'شارژ بر اساس قانون تملک آپارتمان‌ها' }}</p>
        </div>
      </div>
      <div class="d-flex gap-2">
        <span v-if="!online" class="chip muted">
          <AppIcon name="wifi-off" size="sm" />
          آفلاین
        </span>
        <button
          v-if="canInstall || showIosTip"
          class="icon-btn"
          type="button"
          aria-label="نصب برنامه"
          title="نصب برنامه"
          @click="installApp"
        >
          <AppIcon name="download" />
        </button>
        <div class="dropdown">
          <button
            class="icon-btn"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            aria-label="منو"
            title="منو"
          >
            <AppIcon name="three-dots-vertical" />
          </button>
          <ul class="dropdown-menu dropdown-menu-start">
            <li>
              <button class="dropdown-item d-flex align-items-center gap-2" type="button" @click="store.downloadCsv">
                <AppIcon name="file-earmark-spreadsheet" size="sm" />
                خروجی اکسل این ماه
              </button>
            </li>
            <li v-if="canInstall || showIosTip">
              <button class="dropdown-item d-flex align-items-center gap-2" type="button" @click="installApp">
                <AppIcon name="download" size="sm" />
                نصب روی دستگاه
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>

    <MonthSwitcher v-if="showPeriod" />

    <div ref="pageRoot">
      <RouterView />
    </div>
  </div>

  <RouterLink v-if="showFab" class="fab" to="/expenses/new">
    <AppIcon name="plus-lg" size="sm" />
    هزینه جدید
  </RouterLink>

  <nav class="bottom-nav" aria-label="ناوبری اصلی">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.name"
      class="nav-item"
      :class="{ active: isTabActive(tab.name) }"
      :to="tab.to"
      :aria-label="tab.label"
      :title="tab.label"
    >
      <AppIcon :name="isTabActive(tab.name) ? tab.iconActive : tab.icon" />
      <span class="nav-label">{{ tab.label }}</span>
    </RouterLink>
  </nav>

  <ConfirmDialog />
  <PWABadge />
  <div v-if="message" ref="toastEl" class="pwa-toast">{{ message }}</div>
</template>
