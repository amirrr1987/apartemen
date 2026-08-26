import { useRouteQuery } from '@vueuse/router'
import { computed, watch } from 'vue'
import { currentPeriod, periodLabel, shiftPeriod } from '../lib/jalali'
import { useAppStore } from '../stores/app'

export function usePeriod() {
  const store = useAppStore()
  const period = useRouteQuery('p', store.state.currentPeriod, { mode: 'replace' })

  watch(
    period,
    (value) => {
      const next = String(value || store.state.currentPeriod || currentPeriod())
      if (store.state.currentPeriod !== next) store.setPeriod(next)
    },
    { immediate: true },
  )

  watch(
    () => store.state.currentPeriod,
    (value) => {
      if (String(period.value) !== value) period.value = value
    },
  )

  const label = computed(() => periodLabel(store.state.currentPeriod))

  function shift(delta: number) {
    store.setPeriod(shiftPeriod(store.state.currentPeriod, delta))
  }

  return { period, label, shift }
}
