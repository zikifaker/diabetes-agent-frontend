import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useBloodGlucoseStore = defineStore('bloodGlucose', () => {
  const records = ref([])

  async function fetchRecords(start, end) {
    try {
      const response = await api.get('/blood-glucose/records', {
        params: {
          start,
          end
        }
      })
      records.value = response.data.data.records || []
    } catch (error) {
      throw error
    }
  }

  async function addRecord(record) {
    try {
      await api.post('/blood-glucose/record', {
        value: record.value,
        measured_at: record.measuredAt,
        dining_status: record.diningStatus
      })
    } catch (error) {
      throw error
    }
  }

  return {
    records,
    fetchRecords,
    addRecord
  };
});
