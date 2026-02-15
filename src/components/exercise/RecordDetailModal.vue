<template>
  <Teleport to="body">
    <div v-if="show && record" class="modal-overlay" @click.self="handleClose">
      <div class="modal-card">
        <header class="modal-header">
          <div>
            <h3>{{ record.name }}</h3>
          </div>
          <button class="icon-btn" @click="handleClose">
            <CloseIcon />
          </button>
        </header>

        <div class="modal-body">
          <div v-for="item in detailItems" :key="item.label" class="detail-item">
            <span class="label">{{ item.label }}</span>
            <span class="value">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import dayjs from 'dayjs'
import { computed } from 'vue'
import { getExerciseIntensityLabel, getExerciseTypeLabel } from '@/constants/exercise'
import { CloseIcon } from '@/assets/icons/common'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  record: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const typeLabel = computed(() => getExerciseTypeLabel(props.record.type))
const intensityLabel = computed(() => getExerciseIntensityLabel(props.record.intensity))

const detailItems = computed(() => [
  { label: '运动类型', value: typeLabel.value },
  { label: '强度', value: intensityLabel.value },
  { label: '开始时间', value: formatDateTime(props.record.startAt) },
  { label: '结束时间', value: formatDateTime(props.record.endAt) },
  { label: '时长', value: `${props.record.duration} 分钟` },
  { label: '运动前血糖', value: displayGlucose(props.record.preGlucose) },
  { label: '运动后血糖', value: displayGlucose(props.record.postGlucose) },
  { label: '备注', value: props.record.notes || '未填写'}
])

function handleClose() {
  emit('close')
}

function formatDateTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '----/--/-- --:--'
}

function displayGlucose(value) {
  return value > 0 ? `${value} mmol/L` : '未填写'
}
</script>

<style scoped>
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
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn:hover {
  background-color: #fee2e2;
  color: #ef4444;
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
  font-weight: 500;
}
</style>
