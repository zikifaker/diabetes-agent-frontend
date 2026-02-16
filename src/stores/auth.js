import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)

  async function login({ 
    email, 
    credential, 
    type = 'password' 
  }) {
    const response = await api.post('/user/login', {
      email,
      [type === 'password' ? 'password' : 'code']: credential,
      type
    })
    const authData = response.data.data
    token.value = authData.token
    user.value = {
      email: authData.email,
      avatar: authData.avatar
    }
    localStorage.setItem('token', authData.token)
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  async function register(email, password) {
    const response = await api.post('/user/register', {
      email,
      password
    })
    const authData = response.data.data
    token.value = authData.token
    user.value = {
      email: authData.email,
      avatar: authData.avatar
    }
    localStorage.setItem('token', authData.token)
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function sendVerificationCode(email) {
    await api.post('/user/code', { email })
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    logout,
    sendVerificationCode
  }
})
