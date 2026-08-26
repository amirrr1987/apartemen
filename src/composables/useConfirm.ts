import { ref } from 'vue'

const open = ref(false)
const text = ref('')
let resolver: ((value: boolean) => void) | null = null

export function useConfirm() {
  function confirm(prompt: string) {
    text.value = prompt
    open.value = true
    return new Promise<boolean>((resolve) => {
      resolver = resolve
    })
  }

  function settle(value: boolean) {
    open.value = false
    resolver?.(value)
    resolver = null
  }

  return { open, text, confirm, settle }
}
