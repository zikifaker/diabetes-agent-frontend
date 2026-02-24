<template>
  <div class="analysis-wrapper">
    <header class="analysis-header">
      <div>
        <h1>血糖记录</h1>
        <p class="date-range">数据范围：{{ displayDateRange }}</p>
      </div>

      <div class="header-actions">
        <button class="add-btn" @click="showAddButton = true">
          <NewIcon />
          <span>记录血糖</span>
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
            <input type="date" v-model="selectedDate" class="date-picker"
              :min="dayjs(customDateRange.start).format('YYYY-MM-DD')"
              :max="dayjs(customDateRange.end).format('YYYY-MM-DD')" />
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
import dayjs from 'dayjs'
import { useBloodGlucoseStore } from '@/stores/blood_glucose'
import { TimeRangeSelector, AddRecordForm, TargetRateCard, DailyAverageChart, DailyFluctuationChart } from '@/components/blood-glucose'
import { CalendarIcon } from '@/assets/icons/blood-glucose'
import { NewIcon } from '@/assets/icons/common'

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
  return `${dayjs(start).format('YYYY-MM-DD HH:mm')} ~ ${dayjs(end).format('YYYY-MM-DD HH:mm')}`
})

const filteredRecords = computed(() => {
  const start = customDateRange.value.start
  const end = customDateRange.value.end
  return records.value.filter(r => {
    const recordTime = dayjs(r.measuredAt)
    return recordTime.isAfter(start) && recordTime.isBefore(end)
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
  setTimeout(() => { toast.value.show = false }, 1500)
}

watch(rangeType, (newType) => {
  if (newType === 'custom') return

  let days = 1
  if (newType === '7d') days = 7
  if (newType === '30d') days = 30

  const start = dayjs().subtract(days - 1, 'day').startOf('day')
  const end = dayjs().endOf('day')

  customDateRange.value = { start, end }
}, { immediate: true })

watch(customDateRange, async (newCustom) => {
  const start = dayjs(newCustom.start)
  const end = dayjs(newCustom.end)
  try {
    await bloodGlucoseStore.fetchRecords(start.toISOString(), end.toISOString())
  } catch (error) {
    console.error('Failed to fetch blood glucose records:', error)
  }
}, { deep: true })

onMounted(async () => {
  // 默认加载最近 30 天的数据
  const defaultStart = dayjs().subtract(29, 'days').startOf('day')
  const defaultEnd = dayjs().endOf('day')

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
  padding: 24px 32px;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 12px;
}

.analysis-header h1 {
  font-size: 20px;
  font-weight: 600;
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

.add-btn svg {
  flex-shrink: 0;
}

.add-btn:hover {
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
</style>
