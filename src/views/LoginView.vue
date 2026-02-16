<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">登录</h1>
      <p class="auth-subtitle">欢迎使用 Diabetes Agent</p>
      <div class="login-type-selector">
        <button class="login-type-btn" :class="{ active: loginType === 'password' }" @click="loginType = 'password'">
          密码登录
        </button>
        <button class="login-type-btn" :class="{ active: loginType === 'code' }" @click="loginType = 'code'">
          验证码登录
        </button>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="email" type="email" placeholder="输入邮箱" required />
        </div>
        <div v-if="loginType === 'password'" class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="输入密码" required minlength="6" />
        </div>
        <div v-else class="form-group">
          <label>验证码</label>
          <div class="code-input-group">
            <input v-model="code" type="text" placeholder="输入验证码" required maxlength="6" />
            <button type="button" class="code-btn" @click="sendVerificationCode" :disabled="countdown > 0">
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </button>
          </div>
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '...' : '登录' }}
        </button>

        <div class="error-wrapper">
          <Transition name="fade">
            <div v-if="error" class="error-message">
              {{ error }}
            </div>
          </Transition>
        </div>

        <p class="auth-link">
          未注册?
          <router-link to="/register">注册</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginType = ref('password')
const email = ref('')
const password = ref('')
const code = ref('')
const countdown = ref(0)
const loading = ref(false)
const error = ref('')

let errorTimer = null

async function handleLogin() {
  if (errorTimer) clearTimeout(errorTimer)

  loading.value = true
  error.value = ''

  try {
    await authStore.login({
      email: email.value,
      type: loginType.value,
      credential: loginType.value === 'password' ? password.value : code.value
    })
    router.push('/')
  } catch (err) {
    error.value = loginType.value === 'password' ? '邮箱或密码错误' : '验证码错误'
    errorTimer = setTimeout(() => { error.value = '' }, 2000)
  } finally {
    loading.value = false
  }
}

const sendVerificationCode = async () => {
  if (errorTimer) clearTimeout(errorTimer)

  error.value = ''

  if (!email.value) {
    error.value = '请输入邮箱'
    errorTimer = setTimeout(() => { error.value = '' }, 2000)
    return
  }

  try {
    await authStore.sendVerificationCode(email.value)
    startCountdown()
  } catch (err) {
    error.value = '获取验证码失败，请稍后重试'
    errorTimer = setTimeout(() => { error.value = '' }, 2000)
  }
}

const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
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

.login-type-selector {
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.login-type-btn {
  flex: 1;
  padding: 0.75rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #64748b;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.login-type-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  font-weight: 500;
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

.code-input-group {
  display: flex;
  gap: 0.5rem;
}

.code-input-group input {
  flex: 1;
}

.code-btn {
  min-width: 100px;
  background-color: #f9f3f1;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 0 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.code-btn:disabled {
  background-color: #e2e8f0;
  cursor: not-allowed;
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
  transition: opacity 0.3s ease;
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
