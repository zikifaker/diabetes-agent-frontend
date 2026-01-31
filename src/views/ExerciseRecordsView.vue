<template>
  <div class="exercise-wrapper">
    <header class="page-header">
      <div>
        <h1>运动记录</h1>
        <p class="subtitle">通过日历快速定位每日运动情况</p>
      </div>

      <div class="header-actions">
        <div class="month-switcher">
          <button class="nav-btn" @click="changeMonth(-1)" aria-label="上一个月">
            <span>‹</span>
          </button>
          <div class="month-label">{{ monthLabel }}</div>
          <button class="nav-btn" @click="changeMonth(1)" aria-label="下一个月">
            <span>›</span>
          </button>
        </div>
      </div>
    </header>

    <section class="content">
      <div class="calendar-panel">
        <div class="calendar-head">
          <span v-for="day in weekdays" :key="day">{{ day }}</span>
        </div>

        <div class="calendar-grid">
          <button v-for="day in calendarDays" :key="day.date.format('YYYY-MM-DD')" class="day-cell" :class="{
            'out-month': !day.isCurrentMonth,
            today: day.isToday,
            selected: day.date.isSame(selectedDate, 'day')
          }" @click="selectDate(day.date)">
            <span class="day-number">{{ day.date.date() }}</span>
            <span class="record-count" v-if="day.count">{{ day.count }} 条</span>
          </button>
        </div>
      </div>

      <div class="records-panel">
        <div class="panel-header">
          <div>
            <h3>{{ selectedDateLabel }}</h3>
            <p class="panel-subtitle">
              {{ dailyRecords.length ? `共有 ${dailyRecords.length} 条记录` : '暂无记录' }}
            </p>
          </div>

          <button class="ghost-btn" @click="openAddModal">
            <NewIcon />
            <span>添加记录</span>
          </button>
        </div>

        <div v-if="dailyRecords.length" class="records-list">
          <div v-for="record in dailyRecords" :key="record.id" class="record-card" @click="openDetail(record)">
            <div>
              <p class="record-name">{{ record.name || '未命名' }}</p>
              <p class="record-meta">{{ formatTimeRange(record) }}</p>
            </div>
            <div class="record-actions">
              <div class="record-type">{{ getExerciseTypeLabel(record.type) }}</div>
              <button class="delete-btn" @click.stop="handleDelete(record.id)" title="删除记录">
                <TrashIcon />
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>当前日期暂无运动记录</p>
          <button class="primary-link" @click="openAddModal">去记录</button>
        </div>
      </div>
    </section>

    <RecordDetailModal :show="showDetailModal" :record="activeRecord" @close="closeDetail" />

    <AddRecordForm :show="showAddModal" :defaultDate="selectedDate" :saving="saving" @close="closeAddModal"
      @submit="handleSaveRecord" />

    <div v-if="toast.show" class="toast"
      :class="{ 'toast-success': toast.type === 'success', 'toast-error': toast.type === 'error' }">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { storeToRefs } from 'pinia'
import { useExerciseStore } from '@/stores/exercise'
import { NewIcon, TrashIcon } from '@/icons/common'
import { AddRecordForm, RecordDetailModal } from '@/components/exercise'
import { getExerciseTypeLabel } from '@/constants/exercise'

const exerciseStore = useExerciseStore()
const { records } = storeToRefs(exerciseStore)

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const currentMonth = ref(dayjs().startOf('month').toDate())
const selectedDate = ref(new Date())

const showDetailModal = ref(false)
const showAddModal = ref(false)
const activeRecord = ref(null)
const saving = ref(false)

const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

const monthLabel = computed(() => dayjs(currentMonth.value).format('YYYY-MM'))
const selectedDateLabel = computed(() => dayjs(selectedDate.value).format('YYYY-MM-DD'))

const recordCountMap = computed(() => {
  return records.value.reduce((acc, record) => {
    const key = dayjs(record.startAt).format('YYYY-MM-DD')
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
})

// 生成日历格数组
const calendarDays = computed(() => {
  const startOfMonth = dayjs(currentMonth.value).startOf('month')
  const beginWeekday = startOfMonth.day()
  const firstCell = startOfMonth.subtract(beginWeekday, 'day')
  const days = []

  for (let i = 0; i < 35; i++) {
    const date = firstCell.add(i, 'day')
    const key = date.format('YYYY-MM-DD')
    days.push({
      date,
      isCurrentMonth: date.month() === startOfMonth.month(),
      isToday: date.isSame(dayjs(), 'day'),
      count: recordCountMap.value[key] || 0
    })
  }

  return days
})

// 获取当前日期的运动记录，按开始时间排序
const dailyRecords = computed(() => {
  const key = dayjs(selectedDate.value).format('YYYY-MM-DD')
  return records.value
    .filter(record => dayjs(record.startAt).format('YYYY-MM-DD') === key)
    .sort((a, b) => {
      const aTime = dayjs(a.startAt).valueOf()
      const bTime = dayjs(b.startAt).valueOf()
      return aTime - bTime
    })
})

function changeMonth(delta) {
  currentMonth.value = dayjs(currentMonth.value).add(delta, 'month').toDate()
}

function selectDate(date) {
  selectedDate.value = date.toDate()
}

async function handleSaveRecord(record) {
  saving.value = true
  try {
    await exerciseStore.addRecord(record)
    showToast('保存成功')
    closeAddModal()
    fetchMonthRecords()
  } catch (error) {
    console.error('Failed to add exercise record:', error)
    showToast('保存失败', 'error')
  } finally {
    saving.value = false
  }
}

async function handleDelete(id) {
  try {
    await exerciseStore.deleteRecord(id)
    showToast('删除成功')
  } catch (error) {
    console.error('Failed to delete record:', error)
    showToast('删除失败', 'error')
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

function openDetail(record) {
  activeRecord.value = record
  showDetailModal.value = true
}

function closeDetail() {
  showDetailModal.value = false
  activeRecord.value = null
}

function openAddModal() {
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
}

async function fetchMonthRecords() {
  const start = dayjs(currentMonth.value).startOf('month').toISOString()
  const end = dayjs(currentMonth.value).endOf('month').toISOString()
  try {
    await exerciseStore.fetchRecords(start, end)
  } catch (error) {
    console.error('Failed to fetch exercise records:', error)
  }
}

function formatTimeRange(record) {
  const start = dayjs(record.startAt).format('HH:mm') || '--:--'
  const end = dayjs(record.endAt).format('HH:mm') || '--:--'
  return `${start} - ${end}`
}

// 重置选中日期，重新获取月度记录
watch(currentMonth, () => {
  const current = dayjs(currentMonth.value)
  if (!dayjs(selectedDate.value).isSame(current, 'month')) {
    selectedDate.value = current.toDate()
    fetchMonthRecords()
  }
})

onMounted(fetchMonthRecords)
</script>

<style scoped>
.exercise-wrapper {
  --panel-height: 520px;
  min-height: 100vh;
  background: #f5f7fb;
  padding: 24px 32px 48px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.subtitle {
  margin-top: 6px;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.month-switcher {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--white);
  border-radius: 999px;
  padding: 6px 12px;
  border: 1px solid var(--border-color);
}

.month-label {
  font-weight: 500;
  color: var(--text-primary);
}

.nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: var(--transition);
}

.nav-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--primary-color);
  color: white;
  border-radius: var(--radius);
  font-weight: 600;
  transition: var(--transition);
}

.primary-btn:hover {
  background: var(--primary-hover);
}

.ghost-btn {
  background: #3182ce;
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
}

.ghost-btn:hover {
  transform: translateY(-1px);
}

.content {
  display: grid;
  grid-template-columns: 2fr 1.2fr;
  gap: 24px;
  align-items: flex-start;
}

.calendar-panel,
.records-panel {
  background: white;
  border-radius: 20px;
  padding: 20px 24px 28px;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.06);
}

.calendar-panel {
  height: var(--panel-height);
  display: flex;
  flex-direction: column;
}

.calendar-head {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  flex: 1;
  grid-auto-rows: minmax(0, 1fr);
}

.day-cell {
  min-height: 0;
  height: 100%;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 8px;
  text-align: left;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.day-cell:hover {
  border-color: var(--primary-color);
  background: #eef5ff;
}

.day-number {
  font-weight: 600;
  color: var(--text-primary);
}

.record-count {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(66, 133, 244, 0.12);
  color: var(--primary-color);
}

.day-cell.out-month {
  opacity: 0.4;
}

.day-cell.today {
  border-color: var(--primary-color);
}

.day-cell.selected {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.day-cell.selected .record-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.records-panel {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 20px;
  padding: 20px 24px 28px;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.06);
  height: var(--panel-height);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 20px;
  color: var(--text-primary);
}

.panel-subtitle {
  color: var(--text-secondary);
  margin-top: 4px;
  font-size: 13px;
}

.records-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-right: 8px;
  margin-top: 8px;
}

.records-list::-webkit-scrollbar {
  width: 6px;
}

.records-list::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 10px;
}

.records-list::-webkit-scrollbar-track {
  background: transparent;
}

.record-card {
  position: relative;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 14px 16px;
  margin-top: 1px;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  transition: var(--transition);
}

.record-card:hover {
  transform: translateY(-1px);
  cursor: pointer;
}

.record-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.record-meta {
  font-size: 13px;
  color: var(--text-secondary);
}

.record-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.record-type {
  padding: 4px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4c1d95;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.delete-btn {
  opacity: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
  transform: scale(0.9);
}

.record-card:hover .delete-btn {
  opacity: 1;
  transform: scale(1);
}

.delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  margin-top: 60px;
}

.primary-link {
  margin-top: 12px;
  color: var(--primary-color);
  font-weight: 600;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-card {
  width: min(680px, 100%);
  background: white;
  border-radius: 20px;
  padding: 24px 28px 32px;
  box-shadow: 0 40px 120px rgba(15, 23, 42, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
  font-size: 22px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f1f5f9;
  font-size: 20px;
  color: #475569;
}

.modal-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 14px;
  background: #f8fafc;
}

.label {
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  font-size: 14px;
  color: #0f172a;
  font-weight: 600;
}

.form-card {
  max-height: 90vh;
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.form-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
}

.form-grid input,
.form-grid select,
.form-grid textarea {
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 10px 12px;
  font-size: 14px;
  transition: var(--transition);
}

.form-grid input:focus,
.form-grid select:focus,
.form-grid textarea:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.15);
}

.full-row {
  grid-column: 1 / -1;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
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
  z-index: 2000;
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

@media (max-width: 1024px) {
  .content {
    grid-template-columns: 1fr;
  }

  .records-panel {
    height: auto;
    max-height: 500px;
    order: -1;
  }

  .calendar-panel {
    height: auto;
  }
}
</style>
