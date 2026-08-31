<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { useToast } from '../composables/useToast'
import { isAuthConfigured, useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { notify } = useToast()

const username = ref('')
const password = ref('')
const submitting = ref(false)

function onSubmit() {
  if (!isAuthConfigured()) {
    notify('نام کاربری و رمز عبور در تنظیمات سرور تعریف نشده است')
    return
  }
  submitting.value = true
  const ok = auth.login(username.value, password.value)
  submitting.value = false
  if (!ok) {
    notify('نام کاربری یا رمز عبور اشتباه است')
    return
  }
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  void router.replace(redirect)
}
</script>

<template>
  <div class="login-screen">
    <div class="login-card panel">
      <div class="login-brand">
        <div class="brand-mark">ش</div>
        <div>
          <h1>ورود به شارژ ساختمان</h1>
          <p>برای دسترسی به اطلاعات، وارد شوید.</p>
        </div>
      </div>

      <form class="login-form" @submit.prevent="onSubmit">
        <label class="form-label" for="username">نام کاربری</label>
        <input
          id="username"
          v-model="username"
          class="field mb-3"
          type="text"
          autocomplete="username"
          required
        />

        <label class="form-label" for="password">رمز عبور</label>
        <input
          id="password"
          v-model="password"
          class="field mb-4"
          type="password"
          autocomplete="current-password"
          required
        />

        <button class="primary-btn w-100" type="submit" :disabled="submitting">
          <AppIcon name="box-arrow-in-left" size="sm" />
          {{ submitting ? 'در حال ورود…' : 'ورود' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-screen {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: 24px 16px;
}

.login-card {
  width: min(100%, 420px);
  padding: 24px;
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}

.login-brand h1 {
  margin: 0 0 4px;
  font-size: 1.15rem;
}

.login-brand p {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.login-form {
  margin: 0;
}
</style>
