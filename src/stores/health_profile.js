import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useHealthProfileStore = defineStore('healthProfile', () => {
  const healthProfile = ref(null)

  async function fetchProfile() {
    try {
      const response = await api.get('/health-profile')
      const profile = response.data.data
      if (!profile) {
        healthProfile.value = null
      } else {
        healthProfile.value = {
          diabetesType: profile.diabetes_type,
          medication: profile.medication,
          complications: profile.complications
        }
      }
    } catch (error) {
      throw error
    }
  }

  async function createProfile(profile) {
    try {
      await api.post('/health-profile', {
        diabetes_type: profile.diabetesType,
        medication: profile.medication,
        complications: profile.complications
      })
    } catch (error) {
      throw error
    }
  }

  async function updateProfile(profile) {
    try {
      await api.put('/health-profile', {
        diabetes_type: profile.diabetesType,
        medication: profile.medication,
        complications: profile.complications
      })
    } catch (error) {
      throw error
    }
  }

  return {
    healthProfile,
    fetchProfile,
    createProfile,
    updateProfile
  }
})
