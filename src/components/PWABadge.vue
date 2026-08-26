<script setup lang="ts">
import { computed } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import AppIcon from './AppIcon.vue'

const period = 60 * 60 * 1000

function registerPeriodicSync(swUrl: string, r: ServiceWorkerRegistration) {
  setInterval(async () => {
    if ('onLine' in navigator && !navigator.onLine) return

    const resp = await fetch(swUrl, {
      cache: 'no-store',
      headers: {
        cache: 'no-store',
        'cache-control': 'no-cache',
      },
    })

    if (resp?.status === 200) await r.update()
  }, period)
}

const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
  immediate: true,
  onRegisteredSW(swUrl, r) {
    if (r?.active?.state === 'activated') {
      registerPeriodicSync(swUrl, r)
    } else if (r?.installing) {
      r.installing.addEventListener('statechange', (e) => {
        const sw = e.target as ServiceWorker
        if (sw.state === 'activated') registerPeriodicSync(swUrl, r)
      })
    }
  },
})

const title = computed(() => {
  if (offlineReady.value) return 'برنامه آماده استفاده آفلاین است.'
  if (needRefresh.value) return 'نسخه جدید آماده است. برای به‌روزرسانی، بارگذاری مجدد را بزنید.'
  return ''
})

function close() {
  offlineReady.value = false
  needRefresh.value = false
}
</script>

<template>
  <div
    v-if="offlineReady || needRefresh"
    class="pwa-toast"
    aria-labelledby="toast-message"
    role="alert"
  >
    <div class="message">
      <span id="toast-message">{{ title }}</span>
    </div>
    <div class="buttons">
      <button v-if="needRefresh" type="button" class="reload" @click="updateServiceWorker()">
        <AppIcon name="arrow-clockwise" size="sm" />
        بارگذاری مجدد
      </button>
      <button type="button" aria-label="بستن" @click="close">
        <AppIcon name="x-lg" size="sm" />
        بستن
      </button>
    </div>
  </div>
</template>
