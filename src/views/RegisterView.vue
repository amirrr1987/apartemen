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

async function onSubmit() {
  if (password.value !== confirmPassword.value) {
    notify('رمز عبور و تکرار آن یکسان نیست')
    return
  }

  submitting.value = true
  const result = await auth.register(username.value, password.value, displayName.value)
  submitting.value = false

  if (!result.ok) {
    notify(result.error)
    return
  }

  notify(`خوش آمدید ${result.displayName}`)
  void router.replace('/')
}
</script>

<template>
  <div class="login-screen">
    <div class="login-card panel">
      <div class="login-brand">
        <div class="brand-mark">ش</div>
        <div>
          <h1>ثبت‌نام</h1>
          <p>حساب کاربری جدید بسازید و وارد شوید.</p>
        </div>
      </div>

      <form class="login-form" @submit.prevent="onSubmit">
        <label class="form-label" for="displayName">نام نمایشی</label>
        <input
          id="displayName"
          v-model="displayName"
          class="field mb-3"
          type="text"
          autocomplete="name"
          placeholder="مثلاً امیر رضایی"
        />

        <label class="form-label" for="username">نام کاربری</label>
        <input
          id="username"
          v-model="username"
          class="field mb-3"
          type="text"
          autocomplete="username"
          required
          minlength="3"
        />

        <label class="form-label" for="password">رمز عبور</label>
        <input
          id="password"
          v-model="password"
          class="field mb-3"
          type="password"
          autocomplete="new-password"
          required
          minlength="4"
        />

        <label class="form-label" for="confirmPassword">تکرار رمز عبور</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          class="field mb-4"
          type="password"
          autocomplete="new-password"
          required
          minlength="4"
        />

        <button class="primary-btn w-100 mb-3" type="submit" :disabled="submitting">
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

<style scoped>
.auth-switch {
  margin: 0;
  text-align: center;
  color: var(--muted);
  font-size: 0.9rem;
}

.auth-switch a {
  color: var(--primary);
  font-weight: 700;
  text-decoration: none;
}
</style>
