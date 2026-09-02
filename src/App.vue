<script setup lang="ts">
import { useNProgress } from '@vueuse/integrations/useNProgress'
import { useOnline } from '@vueuse/core'
import { gsap } from 'gsap'
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import AppIcon from './components/AppIcon.vue'
import AppMenu from './components/AppMenu.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import MonthSwitcher from './components/MonthSwitcher.vue'
import PWABadge from './components/PWABadge.vue'
import { usePageEnter } from './composables/usePageEnter'
import { usePwaInstall } from './composables/usePwaInstall'
import { useToast } from './composables/useToast'
import { useAppStore } from './stores/app'
import { useAuthStore } from './stores/auth'
import { drawerNav, isDrawerNavActive, isNavActive, primaryNav } from './lib/navigation'

const store = useAppStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const online = useOnline()
const { message, notify } = useToast()
const { canInstall, showIosTip, install } = usePwaInstall()
const { start, done } = useNProgress()
const pageRoot = ref<HTMLElement | null>(null)
const mainRef = ref<HTMLElement | null>(null)
const toastEl = ref<HTMLElement | null>(null)
const menuOpen = ref(false)

usePageEnter(pageRoot)

router.beforeEach(() => {
  start()
  return true
})

router.afterEach(async () => {
  done()
  await nextTick()
  mainRef.value?.focus({ preventScroll: true })
})

watch(message, async (value) => {
  if (!value) return
  await nextTick()
  if (!toastEl.value) return
  gsap.fromTo(toastEl.value, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.28 })
})

const title = computed(() => store.state.settings.buildingName || 'ساختمان')
const isAuthPage = computed(() => ['login', 'register'].includes(String(route.name)))
const isSetup = computed(() => route.name === 'setup')
const showFab = computed(() => !isAuthPage.value && !isSetup.value && route.meta.fab === true)
const showBack = computed(() => !isAuthPage.value && !isSetup.value && ['expense-new', 'expense-edit', 'unit'].includes(String(route.name)))
const showPeriod = computed(() => !isAuthPage.value && !isSetup.value && route.name !== 'guide' && route.name !== 'settings')
const menuUsername = computed(() => auth.currentUser?.displayName)
const drawerPageActive = computed(() => isDrawerNavActive(route.name))

async function installApp() {
  if (showIosTip.value && !canInstall.value) {
    notify('در Safari از اشتراک‌گذاری، Add to Home Screen را بزنید', 5000)
    return
  }
  const ok = await install()
  notify(ok ? 'برنامه روی دستگاه نصب شد' : 'نصب لغو شد')
}

function onLogout() {
  auth.logout()
  void router.replace({ name: 'login' })
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <RouterView v-if="isAuthPage || isSetup" />

  <div v-else-if="!store.ready" class="db-loading">
    <p>در حال بارگذاری از پایگاه داده…</p>
  </div>
  <template v-else>
  <div class="screen" :class="{ 'has-fab': showFab }">
    <header class="topbar">
      <div class="brand">
        <button
          v-if="showBack"
          class="icon-btn"
          type="button"
          aria-label="بازگشت"
          @click="router.back()"
        >
          <AppIcon name="chevron-right" />
        </button>
        <div>
          <h1>{{ title }}</h1>
          <p>{{ (route.meta.title as string) || 'شارژ بر اساس قانون تملک آپارتمان‌ها' }}</p>
        </div>
      </div>
      <div class="topbar-actions">
        <span v-if="store.syncing" class="chip muted">
          <AppIcon name="cloud-upload" size="sm" />
          ذخیره…
        </span>
        <span v-else-if="store.dbError" class="chip danger" :title="store.dbError">
          <AppIcon name="cloud-slash" size="sm" />
          خطای همگام‌سازی
        </span>
        <span v-if="!online" class="chip muted">
          <AppIcon name="wifi-off" size="sm" />
          آفلاین
        </span>
        <button
          class="icon-btn menu-trigger"
          :class="{ active: menuOpen || drawerPageActive }"
          type="button"
          :aria-label="menuOpen ? 'بستن منو' : 'باز کردن منو'"
          aria-haspopup="dialog"
          :aria-expanded="menuOpen"
          @click="toggleMenu"
        >
          <AppIcon :name="menuOpen ? 'x-lg' : 'list'" />
        </button>
      </div>
    </header>

    <AppMenu
      :open="menuOpen"
      :items="drawerNav"
      :username="menuUsername"
      :building-name="title"
      :can-install="canInstall"
      :show-ios-tip="showIosTip"
      @close="closeMenu"
      @export-csv="store.downloadCsv"
      @install="installApp"
      @logout="onLogout"
    />

    <main
      id="main-content"
      ref="mainRef"
      class="main-content"
      tabindex="-1"
    >
      <MonthSwitcher v-if="showPeriod" />

      <div ref="pageRoot">
        <RouterView />
      </div>
    </main>
  </div>

  <RouterLink v-if="showFab" class="fab" to="/expenses/new">
    <AppIcon name="plus-lg" size="sm" />
    هزینه جدید
  </RouterLink>

  <nav class="bottom-nav" aria-label="ناوبری اصلی">
    <RouterLink
      v-for="tab in primaryNav"
      :key="tab.name"
      class="nav-item"
      :class="{ active: isNavActive(route.name, tab.name) }"
      :to="tab.to"
      :aria-label="tab.label"
      :aria-current="isNavActive(route.name, tab.name) ? 'page' : undefined"
    >
      <AppIcon
        :name="isNavActive(route.name, tab.name) ? tab.iconActive : tab.icon"
        aria-hidden="true"
        class="nav-item-icon"
      />
      <span class="nav-label">{{ tab.label }}</span>
    </RouterLink>
  </nav>

  <ConfirmDialog />
  <PWABadge />
  <div v-if="message" ref="toastEl" class="pwa-toast">{{ message }}</div>
  </template>
</template>
