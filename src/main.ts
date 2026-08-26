import { createPinia } from 'pinia'
import { gsap } from 'gsap'
import { createApp } from 'vue'
import 'bootstrap/dist/css/bootstrap.rtl.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'vazirmatn/Vazirmatn-Variable-font-face.css'
import 'bootstrap/js/dist/collapse'
import 'bootstrap/js/dist/dropdown'
import './styles/app.css'
import App from './App.vue'
import router from './router'

gsap.defaults({ duration: 0.4, ease: 'power2.out' })

const legacy = window.location.hash.replace(/^#\/?/, '')
if (legacy === 'home') window.location.hash = '/'
else if (['expenses', 'payments', 'report', 'units', 'guide', 'settings'].includes(legacy)) {
  window.location.hash = `/${legacy}`
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
