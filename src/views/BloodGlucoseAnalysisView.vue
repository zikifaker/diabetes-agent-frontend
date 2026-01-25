<template>
  <div class="analysis-wrapper">
    <header class="analysis-header">
      <div>
        <h1>血糖分析</h1>
        <p class="date-range">数据范围：{{ displayDateRange }}</p>
      </div>

      <div class="header-actions">
        <button class="add-btn" @click="showAddButton = true">
          <NewRecordIcon />
          <span>记录血糖</span>
        </button>
        <button class="report-btn">
          <ViewReportIcon />
          <span>查看报告</span>
        </button>
      </div>
    </header>

    <AddRecordForm :show="showAddButton" @close="handleClose" @save="handleSave" />

    <TimeRangeSelector v-model:rangeType="rangeType" v-model:customRange="customDateRange" />

    <TargetRateCard :records="filteredRecords" :lowThreshold="lowBloodGlucose" :highThreshold="highBloodGlucose" />

    <div class="chart-grid">
      <section class="chart-card">
        <h3 class="card-title">每日平均血糖</h3>
        <div class="chart-container">
          <DailyAverageChart :records="filteredRecords" />
        </div>
      </section>

      <section class="chart-card">
        <div class="card-header">
          <h3 class="card-title">单日血糖波动</h3>
          <div class="date-picker-wrapper">
            <CalendarIcon class="calendar-icon" />
            <input type="date" v-model="selectedDate" class="date-picker" :min="formatLocalDate(customDateRange.start)"
              :max="formatLocalDate(customDateRange.end)" />
          </div>
        </div>
        <div class="chart-container">
          <DailyFluctuationChart :records="filteredRecords" :date="selectedDate" />
        </div>
      </section>
    </div>

    <div v-if="toast.show" class="toast"
      :class="{ 'toast-success': toast.type === 'success', 'toast-error': toast.type === 'error' }">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useBloodGlucoseStore } from '@/stores/blood_glucose'
import { TimeRangeSelector, AddRecordForm, TargetRateCard, DailyAverageChart, DailyFluctuationChart } from '@/components/blood-glucose'
import { NewRecordIcon, ViewReportIcon, CalendarIcon } from '@/icons/blood-glucose'
import { formatLocalDate, formatLocalDateTime } from '@/utils/time'

const bloodGlucoseStore = useBloodGlucoseStore()
const { records } = storeToRefs(bloodGlucoseStore)

const showAddButton = ref(false)
const rangeType = ref('1d')
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const lowBloodGlucose = ref(3.9)
const highBloodGlucose = ref(6.1)

const customDateRange = ref({
  start: new Date(),
  end: new Date()
})

const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

const displayDateRange = computed(() => {
  const { start, end } = customDateRange.value
  return `${formatLocalDateTime(start)} ~ ${formatLocalDateTime(end)}`
})

const filteredRecords = computed(() => {
  const startTs = customDateRange.value.start.getTime()
  const endTs = customDateRange.value.end.getTime()

  return records.value.filter(r => {
    const t = new Date(r.measuredAt).getTime()
    return t >= startTs && t <= endTs
  })
})

const handleClose = () => {
  showAddButton.value = false
}

const handleSave = async (record) => {
  try {
    await bloodGlucoseStore.addRecord(record)
  } catch (error) {
    showToast('保存失败', 'error')
    console.error('Failed to add blood glucose record:', error)
    return
  }

  showToast('保存成功', 'success')
  handleClose()

  try {
    await bloodGlucoseStore.fetchRecords(
      customDateRange.value.start.toISOString(),
      customDateRange.value.end.toISOString()
    )
  } catch (error) {
    console.error('Failed to fetch blood glucose records:', error)
  }
}

function showToast(message, type = 'success') {
  toast.value = {
    show: true,
    message,
    type
  }
  setTimeout(() => {
    toast.value.show = false
  }, 1500)
}

watch(rangeType, (newType) => {
  if (newType === 'custom') return

  let days = 1
  if (newType === '7d') days = 7
  if (newType === '30d') days = 30

  const start = new Date()
  start.setDate(start.getDate() - days + 1)
  start.setHours(0, 0, 0, 0)

  const end = new Date()
  end.setHours(23, 59, 59, 999)

  customDateRange.value = { start, end }
}, { immediate: true })

watch(customDateRange, async (newCustom) => {
  const start = new Date(newCustom.start)
  const end = new Date(newCustom.end)

  const defaultStart = new Date()
  defaultStart.setDate(defaultStart.getDate() - 29)
  defaultStart.setHours(0, 0, 0, 0)

  const defaultEnd = new Date()
  defaultEnd.setHours(23, 59, 59, 999)

  // 如果自定义日期范围不在最近 30 天内，则重新获取数据
  if (start < defaultStart || end > defaultEnd) {
    try {
      await bloodGlucoseStore.fetchRecords(start.toISOString(), end.toISOString())
    } catch (error) {
      console.error('Failed to fetch blood glucose records:', error)
    }
  }
}, { deep: true })

onMounted(async () => {
  // 默认加载最近 30 天的数据
  const defaultStart = new Date()
  defaultStart.setDate(defaultStart.getDate() - 29)
  defaultStart.setHours(0, 0, 0, 0)

  const defaultEnd = new Date()
  defaultEnd.setHours(23, 59, 59, 999)

  try {
    await bloodGlucoseStore.fetchRecords(defaultStart.toISOString(), defaultEnd.toISOString())
  } catch (error) {
    console.error('Failed to fetch blood glucose records:', error)
  }
})
</script>

<style scoped>
.analysis-wrapper {
  background: #f4f7fa;
  min-height: 100vh;
  padding: 32px 40px;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.analysis-header h1 {
  font-size: 26px;
  font-weight: 700;
}

.date-range {
  margin-top: 10px;
  font-size: 14px;
  color: #718096;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.add-btn {
  background: #3182ce;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.report-btn {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.add-btn svg,
.report-btn svg {
  flex-shrink: 0;
}

.add-btn:hover,
.report-btn:hover {
  transform: translateY(-1px);
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chart-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.chart-container {
  height: 300px;
  margin-top: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.date-picker-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.calendar-icon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: #94a3b8;
  pointer-events: none;
  z-index: 2;
}

.date-picker {
  position: relative;
  padding: 8px 12px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #4a5568;
  background-color: #f8fafc;
  transition: all 0.2s ease;
  cursor: pointer;
  min-width: 140px;
}

.date-picker::-webkit-calendar-picker-indicator {
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.date-picker::-moz-calendar-picker-indicator {
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.date-picker:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  background-color: white;
}

.date-picker:hover {
  border-color: #cbd5e0;
  background-color: white;
}

.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 6px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
</style>
