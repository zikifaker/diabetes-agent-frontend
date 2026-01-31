import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useExerciseStore = defineStore('exercise', () => {
  const records = ref([])

  async function fetchRecords(start, end) {
    const response = await api.get('/exercise/records', {
      params: { start, end }
    })
    const exerciseRecordData = response.data.data || []
    records.value = exerciseRecordData.map((item) => ({
      id: item.id,
      type: item.type,
      name: item.name,
      intensity: item.intensity,
      startAt: item.start_at,
      endAt: item.end_at,
      duration: item.duration,
      preGlucose: item.pre_glucose,
      postGlucose: item.post_glucose,
      notes: item.notes
    }))
  }

  async function addRecord(record) {
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
  }

  async function deleteRecord(id) {
    await api.delete(`/exercise/record/${id}`)
    records.value = records.value.filter(r => r.id != id)
  }

  return {
    records,
    fetchRecords,
    addRecord,
    deleteRecord
  }
})