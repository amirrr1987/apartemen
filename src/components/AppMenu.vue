<script setup lang="ts">
import { gsap } from 'gsap'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import type { NavItem } from '../lib/navigation'
import { isNavActive } from '../lib/navigation'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  open: boolean
  items: readonly NavItem[]
  username?: string
  buildingName?: string
  canInstall: boolean
  showIosTip: boolean
}>()

const emit = defineEmits<{
  close: []
  exportCsv: []
  install: []
  logout: []
}>()

const route = useRoute()
const shown = ref(false)
const overlayRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const closeBtnRef = ref<HTMLButtonElement | null>(null)
const navItemsRef = ref<HTMLElement | null>(null)
let motionTween: gsap.core.Timeline | null = null

function requestClose() {
  emit('close')
}

function onNavClick() {
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) requestClose()
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

async function animateOpen() {
  await nextTick()
  motionTween?.kill()
  const reduce = prefersReducedMotion()
  const items = navItemsRef.value?.querySelectorAll('.menu-link, .menu-action') ?? []

  gsap.set(overlayRef.value, { autoAlpha: 0 })
  gsap.set(panelRef.value, { x: '100%' })

  motionTween = gsap.timeline()
  motionTween
    .to(overlayRef.value, { autoAlpha: 1, duration: reduce ? 0 : 0.22, ease: 'power2.out' })
    .to(panelRef.value, { x: '0%', duration: reduce ? 0 : 0.32, ease: 'power3.out' }, reduce ? 0 : '-=0.12')

  if (!reduce && items.length) {
    motionTween.from(
      items,
      { x: 16, autoAlpha: 0, duration: 0.24, stagger: 0.04, ease: 'power2.out' },
      '-=0.18',
    )
  }

  closeBtnRef.value?.focus()
}

function animateClose(): Promise<void> {
  motionTween?.kill()
  const reduce = prefersReducedMotion()

  if (reduce) {
    shown.value = false
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    motionTween = gsap.timeline({
      onComplete: () => {
        shown.value = false
        resolve()
      },
    })
    motionTween
      .to(panelRef.value, { x: '100%', duration: 0.22, ease: 'power2.in' })
      .to(overlayRef.value, { autoAlpha: 0, duration: 0.16, ease: 'power2.in' }, '-=0.1')
  })
}

watch(
  () => route.fullPath,
  () => {
    if (props.open) requestClose()
  },
)

watch(
  () => props.open,
  async (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      shown.value = true
      await nextTick()
      await animateOpen()
      return
    }
    if (shown.value) await animateClose()
  },
)

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  motionTween?.kill()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-show="shown"
      ref="overlayRef"
      class="menu-overlay"
      aria-hidden="true"
      @click="requestClose"
    />

    <aside
      v-show="shown"
      ref="panelRef"
      class="menu-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="منوی جانبی"
    >
      <div class="menu-handle" aria-hidden="true" />

      <header class="menu-header">
        <div class="menu-identity">
          <div class="menu-avatar" aria-hidden="true">ش</div>
          <div class="menu-identity-text">
            <p v-if="buildingName" class="menu-building">{{ buildingName }}</p>
            <p class="menu-user">{{ username || 'کاربر' }}</p>
          </div>
        </div>
        <button
          ref="closeBtnRef"
          class="icon-btn menu-close-btn"
          type="button"
          aria-label="بستن منو"
          @click="requestClose"
        >
          <AppIcon name="x-lg" />
        </button>
      </header>

      <div ref="navItemsRef" class="menu-body">
        <p class="menu-section-label">مدیریت</p>
        <nav class="menu-nav" aria-label="صفحات جانبی">
          <RouterLink
            v-for="item in items"
            :key="item.name"
            class="menu-link"
            :class="{ active: isNavActive(route.name, item.name) }"
            :to="item.to"
            :aria-current="isNavActive(route.name, item.name) ? 'page' : undefined"
            @click="onNavClick"
          >
            <span class="menu-link-icon" aria-hidden="true">
              <AppIcon :name="isNavActive(route.name, item.name) ? item.iconActive : item.icon" />
            </span>
            <span class="menu-link-text">
              <span class="menu-link-label">{{ item.label }}</span>
              <span v-if="item.description" class="menu-link-desc">{{ item.description }}</span>
            </span>
            <AppIcon name="chevron-left" class="menu-link-chevron" aria-hidden="true" />
          </RouterLink>
        </nav>

        <div class="menu-divider" role="separator" />

        <p class="menu-section-label">ابزارها</p>
        <div class="menu-actions">
          <button class="menu-action" type="button" @click="emit('exportCsv'); emit('close')">
            <span class="menu-link-icon" aria-hidden="true">
              <AppIcon name="file-earmark-spreadsheet" />
            </span>
            <span class="menu-link-text">
              <span class="menu-link-label">خروجی اکسل</span>
              <span class="menu-link-desc">دانلود گزارش ماه جاری</span>
            </span>
          </button>
          <button
            v-if="canInstall || showIosTip"
            class="menu-action"
            type="button"
            @click="emit('install'); emit('close')"
          >
            <span class="menu-link-icon" aria-hidden="true">
              <AppIcon name="download" />
            </span>
            <span class="menu-link-text">
              <span class="menu-link-label">نصب برنامه</span>
              <span class="menu-link-desc">دسترسی سریع از صفحه اصلی</span>
            </span>
          </button>
        </div>
      </div>

      <footer class="menu-footer">
        <button class="menu-action danger" type="button" @click="emit('logout'); emit('close')">
          <span class="menu-link-icon" aria-hidden="true">
            <AppIcon name="box-arrow-right" />
          </span>
          <span class="menu-link-label">خروج از حساب</span>
        </button>
      </footer>
    </aside>
  </Teleport>
</template>
