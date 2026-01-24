<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">登录</h1>
      <p class="auth-subtitle">开启AI Agent的体验之旅</p>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="email" type="email" placeholder="输入你的邮箱" required />
        </div>

        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="输入你的密码" required />
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>

        <p class="auth-link">
          未注册?
          <router-link to="/register">注册</router-link>
        </p>
      </form>

      <p v-if="error" class="error-message">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''

  try {
    await authStore.login(email.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = '登录失败'
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

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: var(--radius);
  font-size: 14px;
  text-align: center;
}
</style>
