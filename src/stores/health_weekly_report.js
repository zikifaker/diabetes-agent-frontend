import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

export const useHealthWeeklyReportStore = defineStore('healthWeeklyReport', () => {
  const authStore = useAuthStore()

  const reports = ref([])
  const loading = ref(false)

  async function fetchReports() {
    loading.value = true
    try {
      const response = await api.get('/health-weekly-reports')
      const reportsData = response.data.data || []
      reports.value = reportsData.map(report => ({
        startAt: report.start_at,
        endAt: report.end_at,
        fileName: report.file_name
      }))
    } catch (err) {
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateEnableNotification(isEnabled) {
    try {
      await api.put('/health-weekly-reports/notification', { enable_weekly_report_notification: isEnabled })
      authStore.updateUser({ enableNotification: isEnabled })
    } catch (err) {
      throw err
    }
  }

  return {
    reports,
    loading,
    fetchReports,
    updateEnableNotification
  }
})