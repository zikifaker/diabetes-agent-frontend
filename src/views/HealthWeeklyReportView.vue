<template>
  <div class="analysis-wrapper">
    <header class="analysis-header">
      <div>
        <h1>健康周报</h1>
        <p class="date-range">查看您的健康周报历史记录</p>
      </div>
    </header>

    <div class="report-list" v-if="!loading && reports.length > 0">
      <div v-for="report in reports" :key="report.startAt" class="report-item">
        <div class="report-info">
          <h3>健康周报</h3>
          <p class="report-date">{{ formatDateRange(report.startAt, report.endAt) }}</p>
        </div>
        <div class="action-buttons">
          <button class="preview-btn" @click="previewReport(report)">
            <EyeIcon class="btn-icon" />
            <span>预览</span>
          </button>
          <button class="download-btn" @click="downloadReport(report)">
            <DownloadIcon class="btn-icon" />
            <span>下载</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else class="empty-state">
      <p>暂无数据</p>
    </div>

    <div v-if="toast.show" class="toast"
      :class="{ 'toast-success': toast.type === 'success', 'toast-error': toast.type === 'error' }">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import { useHealthWeeklyReportStore } from '@/stores/health_weekly_report'
import { DownloadIcon, EyeIcon } from '@/assets/icons/health-weekly-report'
import { getPresignedURL, NAMESPACE } from '@/utils/oss'

const healthWeeklyReportStore = useHealthWeeklyReportStore()
const { reports, loading } = storeToRefs(healthWeeklyReportStore)

const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

const formatDateRange = (start, end) => {
  return `${dayjs(start).format('YYYY-MM-DD')} 至 ${dayjs(end).format('YYYY-MM-DD')}`
}

const previewReport = async (report) => {
  try {
    const url = await getPresignedURL(report.fileName, NAMESPACE.HEALTH_WEEKLY_REPORT, {
      useCustomDomain: true
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (err) {
    console.error('Error opening health weekly report preview:', err)
  }
}

const downloadReport = async (report) => {
  try {
    const url = await getPresignedURL(report.fileName, NAMESPACE.HEALTH_WEEKLY_REPORT)
    const link = document.createElement('a')
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('报告下载成功', 'success')
  } catch (err) {
    console.error('Failed to download report:', err)
    showToast('报告下载失败', 'error')
  }
}

function showToast(message, type = 'success') {
  toast.value = {
    show: true,
    message,
    type
  }
  setTimeout(() => { toast.value.show = false }, 1500)
}

onMounted(async () => {
  try {
    await healthWeeklyReportStore.fetchReports()
  } catch (err) {
    console.error('Failed to load health weekly reports:', err)
  }
})
</script>

<style scoped>
.analysis-wrapper {
  background: #f4f7fa;
  min-height: 100vh;
  padding: 24px 32px;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 12px;
}

.analysis-header h1 {
  font-size: 24px;
  font-weight: 700;
}

.date-range {
  margin-top: 10px;
  font-size: 14px;
  color: #718096;
}

.report-list {
  background: white;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
  overflow: hidden;
}

.report-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid #f8fafc;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.report-item:last-child {
  border-bottom: none;
}

.report-item:hover {
  background-color: #f9fafb;
  transform: translateX(-1px);
}

.report-info h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.15rem 0;
}

.report-date {
  color: #9ca3af;
  font-size: 0.75rem;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.preview-btn,
.download-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background-color: #ffffff;
  color: #3b82f6;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.preview-btn:hover:not(:disabled),
.download-btn:hover:not(:disabled) {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.25);
}

.btn-icon {
  width: 14px;
  height: 14px;
}

.toast {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 0.875rem;
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
  transition: all 0.3s ease;
}

.toast-success {
  background-color: rgba(236, 253, 245, 0.9);
  border: 1px solid #10b981;
  color: #065f46;
}

.toast-error {
  background-color: rgba(254, 242, 242, 0.9);
  border: 1px solid #ef4444;
  color: #991b1b;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>