import { nextTick, onUnmounted, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { gsap } from 'gsap'

export function usePageEnter(root: Ref<HTMLElement | null>) {
  let mm: ReturnType<typeof gsap.matchMedia> | undefined

  async function enter() {
    mm?.revert()
    await nextTick()
    if (!root.value) return

    mm = gsap.matchMedia()
    mm.add(
      {
        reduce: '(prefers-reduced-motion: reduce)',
        normal: '(prefers-reduced-motion: no-preference)',
      },
      (context) => {
        const reduce = Boolean(context.conditions?.reduce)
        const items = root.value?.querySelectorAll('.js-enter')
        const targets = items && items.length ? Array.from(items) : Array.from(root.value?.children ?? [])
        if (!targets.length) return
        gsap.from(targets, {
          y: reduce ? 0 : 14,
          duration: reduce ? 0 : 0.28,
          stagger: reduce ? 0 : 0.04,
          ease: 'power2.out',
          overwrite: 'auto',
          clearProps: 'transform',
        })
      },
    )
  }

  const route = useRoute()
  watch(
    () => route.fullPath,
    () => {
      void enter()
    },
    { immediate: true },
  )

  onUnmounted(() => {
    mm?.revert()
  })
}
