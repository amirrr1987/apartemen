<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { useToast } from '../composables/useToast'
import { canAuthenticate, useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { notify } = useToast()

const username = ref('')
const password = ref('')
const submitting = ref(false)
const error = ref('')
const hasAccount = canAuthenticate()

async function onSubmit() {
  error.value = ''
  if (!canAuthenticate()) {
    error.value = 'هنوز حسابی ثبت نشده. ابتدا ثبت‌نام کنید.'
    notify(error.value)
    return
  }

  submitting.value = true
  try {
    const ok = await auth.login(username.value, password.value)
    if (!ok) {
      error.value = 'نام کاربری یا رمز عبور اشتباه است'
      notify(error.value)
      return
    }
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    void router.replace(redirect)
  } catch (cause) {
    console.error('login failed', cause)
    error.value = 'ورود انجام نشد. دوباره تلاش کنید.'
    notify(error.value)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-screen">
    <div class="login-card">
      <div class="login-brand">
        <div class="brand-mark">ش</div>
        <div>
          <h1>ورود</h1>
          <p>برای دسترسی به اطلاعات ساختمان وارد شوید.</p>
        </div>
      </div>

      <form class="login-form page" @submit.prevent="onSubmit">
        <p v-if="!hasAccount" class="form-error">
          هنوز حسابی نیست.
          <RouterLink to="/register">ثبت‌نام کنید</RouterLink>
        </p>
        <p v-else-if="error" class="form-error" role="alert">{{ error }}</p>

        <div class="field-group">
          <label class="form-label" for="username">نام کاربری</label>
          <input
            id="username"
            v-model="username"
            class="field"
            type="text"
            autocomplete="username"
            required
          />
        </div>

        <div class="field-group">
          <label class="form-label" for="password">رمز عبور</label>
          <input
            id="password"
            v-model="password"
            class="field"
            type="password"
            autocomplete="current-password"
            required
          />
        </div>

        <button class="primary-btn w-100" type="submit" :disabled="submitting">
          <AppIcon name="box-arrow-in-left" size="sm" />
          {{ submitting ? 'در حال ورود…' : 'ورود' }}
        </button>

        <p class="auth-switch">
          حساب ندارید؟
          <RouterLink to="/register">ثبت‌نام</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
