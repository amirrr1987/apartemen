<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { useToast } from '../composables/useToast'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const { notify } = useToast()

const displayName = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const error = ref('')

async function onSubmit() {
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = 'رمز عبور و تکرار آن یکسان نیست'
    notify(error.value)
    return
  }

  submitting.value = true
  try {
    const result = await auth.register(username.value, password.value, displayName.value)
    if (!result.ok) {
      error.value = result.error
      notify(result.error)
      return
    }
    notify(`خوش آمدید ${result.displayName}`)
    void router.replace('/')
  } catch (cause) {
    console.error('register failed', cause)
    error.value = 'ثبت‌نام انجام نشد. دوباره تلاش کنید.'
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
          <h1>ثبت‌نام</h1>
          <p>حساب کاربری بسازید و وارد شوید.</p>
        </div>
      </div>

      <form class="login-form page" @submit.prevent="onSubmit">
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <div class="field-group">
          <label class="form-label" for="displayName">نام نمایشی</label>
          <input
            id="displayName"
            v-model="displayName"
            class="field"
            type="text"
            autocomplete="name"
            placeholder="مثلاً امیر رضایی"
          />
        </div>

        <div class="field-group">
          <label class="form-label" for="username">نام کاربری</label>
          <input
            id="username"
            v-model="username"
            class="field"
            type="text"
            autocomplete="username"
            required
            minlength="3"
          />
        </div>

        <div class="field-group">
          <label class="form-label" for="password">رمز عبور</label>
          <input
            id="password"
            v-model="password"
            class="field"
            type="password"
            autocomplete="new-password"
            required
            minlength="4"
          />
        </div>

        <div class="field-group">
          <label class="form-label" for="confirmPassword">تکرار رمز عبور</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            class="field"
            type="password"
            autocomplete="new-password"
            required
            minlength="4"
          />
        </div>

        <button class="primary-btn w-100" type="submit" :disabled="submitting">
          <AppIcon name="person-plus" size="sm" />
          {{ submitting ? 'در حال ثبت‌نام…' : 'ثبت‌نام و ورود' }}
        </button>

        <p class="auth-switch">
          حساب دارید؟
          <RouterLink to="/login">ورود</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
