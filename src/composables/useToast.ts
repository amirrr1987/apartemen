import { ref } from 'vue'

const message = ref('')
let timer = 0

export function useToast() {
  function notify(text: string, ms = 2200) {
    window.clearTimeout(timer)
    message.value = text
    timer = window.setTimeout(() => {
      message.value = ''
    }, ms)
  }

  return { message, notify }
}
