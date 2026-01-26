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
          gender: profile.gender,
          age: profile.age,
          height: profile.height,
          weight: profile.weight,
          dietaryPreference: profile.dietary_preference,
          smokingStatus: profile.smoking_status,
          activityLevel: profile.activity_level,
          diabetesType: profile.diabetes_type,
          diagnosisYear: profile.diagnosis_year,
          therapyMode: profile.therapy_mode,
          medication: profile.medication,
          allergies: profile.allergies,
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
        gender: profile.gender,
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        dietary_preference: profile.dietaryPreference,
        smoking_status: profile.smokingStatus,
        activity_level: profile.activityLevel,
        diabetes_type: profile.diabetesType,
        diagnosis_year: profile.diagnosisYear,
        therapy_mode: profile.therapyMode,
        medication: profile.medication,
        allergies: profile.allergies,
        complications: profile.complications
      })
    } catch (error) {
      throw error
    }
  }

  async function updateProfile(profile) {
    try {
      await api.put('/health-profile', {
        gender: profile.gender,
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        dietary_preference: profile.dietaryPreference,
        smoking_status: profile.smokingStatus,
        activity_level: profile.activityLevel,
        diabetes_type: profile.diabetesType,
        diagnosis_year: profile.diagnosisYear,
        therapy_mode: profile.therapyMode,
        medication: profile.medication,
        allergies: profile.allergies,
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
