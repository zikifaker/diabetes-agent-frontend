import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useExerciseStore = defineStore('exercise', () => {
  const records = ref([])

  async function fetchRecords(start, end) {
    try {
      const response = await api.get('/exercise/records', {
        params: { start, end }
      })
      records.value = response.data.data || []
    } catch (error) {
      throw error
    }
  }

  async function addRecord(record) {
    try {
      await api.post('/exercise/record', {
        type: record.type,
        name: record.name,
        intensity: record.intensity,
        start_at: record.startAt,
        end_at: record.endAt,
        duration: record.duration,
        pre_glucose: record.preGlucose,
        post_glucose: record.postGlucose,
        notes: record.notes
      })
    } catch (error) {
      throw error
    }
  }

  return {
    records,
    fetchRecords,
    addRecord
  }
})