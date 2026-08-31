import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HomeView from '../views/HomeView.vue'
import ExpensesView from '../views/ExpensesView.vue'
import ExpenseFormView from '../views/ExpenseFormView.vue'
import PaymentsView from '../views/PaymentsView.vue'
import ReportView from '../views/ReportView.vue'
import UnitsView from '../views/UnitsView.vue'
import UnitDetailView from '../views/UnitDetailView.vue'
import GuideView from '../views/GuideView.vue'
import SettingsView from '../views/SettingsView.vue'
import TheLogin from '../views/TheLogin.vue'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    { path: '/login', name: 'login', component: TheLogin, meta: { title: 'ورود', public: true } },
    { path: '/', name: 'home', component: HomeView, meta: { fab: true, title: 'گزارش کلی' } },
    { path: '/expenses', name: 'expenses', component: ExpensesView, meta: { fab: true, title: 'هزینه‌ها' } },
    { path: '/expenses/new', name: 'expense-new', component: ExpenseFormView, meta: { title: 'هزینه جدید' } },
    { path: '/expenses/:id', name: 'expense-edit', component: ExpenseFormView, meta: { title: 'ویرایش هزینه' } },
    { path: '/payments', name: 'payments', component: PaymentsView, meta: { title: 'دریافت شارژها' } },
    { path: '/report', name: 'report', component: ReportView, meta: { title: 'گزارش' } },
    { path: '/units', name: 'units', component: UnitsView, meta: { title: 'واحدها' } },
    { path: '/units/:id', name: 'unit', component: UnitDetailView, meta: { title: 'واحد' } },
    { path: '/guide', name: 'guide', component: GuideView, meta: { title: 'راهنما' } },
    { path: '/settings', name: 'settings', component: SettingsView, meta: { title: 'تنظیمات' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) {
    if (to.name === 'login' && auth.isLoggedIn) return '/'
    return true
  }
  if (!auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
