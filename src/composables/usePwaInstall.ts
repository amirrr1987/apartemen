import { useEventListener, useMediaQuery } from '@vueuse/core'
import { computed, ref } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function iosStandalone() {
  return 'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
}

function iosDevice() {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function usePwaInstall() {
  const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
  const installed = ref(false)
  const standaloneDisplay = useMediaQuery('(display-mode: standalone)')

  const isStandalone = computed(() => standaloneDisplay.value || iosStandalone())
  const isIos = computed(() => iosDevice())
  const canInstall = computed(() => Boolean(deferredPrompt.value) && !isStandalone.value && !installed.value)
  const showIosTip = computed(() => isIos.value && !isStandalone.value && !installed.value)

  useEventListener(window, 'beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt.value = event as BeforeInstallPromptEvent
  })

  useEventListener(window, 'appinstalled', () => {
    deferredPrompt.value = null
    installed.value = true
  })

  async function install() {
    const promptEvent = deferredPrompt.value
    if (!promptEvent) return false
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    deferredPrompt.value = null
    if (outcome === 'accepted') installed.value = true
    return outcome === 'accepted'
  }

  return { canInstall, showIosTip, isStandalone, installed, install }
}
