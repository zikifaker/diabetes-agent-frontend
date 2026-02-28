<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">注册</h1>
      <p class="auth-subtitle">欢迎使用 Diabetes Agent</p>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="email" type="email" placeholder="输入邮箱，务必确保正确" required />
        </div>

        <div class="form-group">
          <label>密码</label>
          <div class="password-input-wrapper">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="输入密码（至少6位）" required
              minlength="6" class="password-input" />
            <button type="button" class="password-toggle-btn" @click="showPassword = !showPassword">
              <EyeOpenIcon v-if="showPassword" />
              <EyeCloseIcon v-else />
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>确认密码</label>
          <div class="password-input-wrapper">
            <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" placeholder="确认密码" required
              minlength="6" class="password-input" />
            <button type="button" class="password-toggle-btn" @click="showConfirmPassword = !showConfirmPassword">
              <EyeOpenIcon v-if="showConfirmPassword" />
              <EyeCloseIcon v-else />
            </button>
          </div>
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '...' : '注册' }}
        </button>

        <div class="error-wrapper">
          <Transition name="fade">
            <div v-if="error" class="error-message">
              {{ error }}
            </div>
          </Transition>
        </div>

        <p class="auth-link">
          已注册?
          <router-link to="/login">登录</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { EyeOpenIcon, EyeCloseIcon } from '@/assets/icons/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const error = ref('')

let errorTimer = null

async function handleRegister() {
  if (errorTimer) clearTimeout(errorTimer)

  // 校验密码是否一致
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    errorTimer = setTimeout(() => { error.value = '' }, 2000)
    return
  }

  loading.value = true
  error.value = ''

  try {
    await authStore.register(email.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = '注册失败'
    errorTimer = setTimeout(() => { error.value = '' }, 2000)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  padding: 20px;
}

.auth-card {
  background: white;
  padding: 48px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 440px;
}

.auth-title {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.auth-subtitle {
  color: var(--text-secondary);
  margin-bottom: 32px;
  font-size: 16px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input {
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  font-size: 16px;
  transition: var(--transition);
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input {
  width: 100%;
}

.password-toggle-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #64748b;
  border-radius: 4px;
}

.password-toggle-btn:hover {
  background-color: #f3f4f6;
  color: var(--primary-color);
}

.btn-primary {
  padding: 14px 24px;
  background: var(--primary-color);
  color: white;
  border-radius: var(--radius);
  font-size: 16px;
  font-weight: 500;
  transition: var(--transition);
  margin-top: 8px;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
}

.auth-link {
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
}

.auth-link a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.auth-link a:hover {
  text-decoration: underline;
}

.error-wrapper {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  position: relative;
}

.error-message {
  width: 100%;
  padding: 8px;
  background: #fff1f0;
  border: 1px solid #ffa39e;
  color: #cf1322;
  border-radius: var(--radius);
  font-size: 13px;
  text-align: center;
  box-sizing: border-box;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.auth-link {
  margin-top: 8px;
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
