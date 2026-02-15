<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay">
      <div class="modal-card form-card">
        <header class="modal-header">
          <div>
            <h3>记录运动</h3>
          </div>
          <button class="icon-btn" @click="handleClose">
            <CloseIcon />
          </button>
        </header>

        <form class="form-grid" @submit.prevent="handleSubmit">
          <label>
            <span>运动类型</span>
            <select v-model="form.type" required>
              <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>

          <label>
            <span>运动名称</span>
            <input v-model="form.name" type="text" placeholder="如散步、游泳等" required />
          </label>

          <label>
            <span>强度</span>
            <select v-model="form.intensity" required>
              <option v-for="opt in intensityOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>

          <label>
            <span>开始时间</span>
            <input v-model="form.startAt" type="datetime-local" required />
          </label>

          <label>
            <span>结束时间</span>
            <input v-model="form.endAt" type="datetime-local" required />
            <span v-if="timeError" class="error-message">{{ timeError }}</span>
          </label>

          <label>
            <span>时长 (分钟)</span>
            <div class="duration-input">
              <input v-model.number="form.duration" type="number" min="0" placeholder="可自动根据起止时间估算" required />
            </div>
          </label>

          <label>
            <span>运动前血糖 (mmol/L)</span>
            <input v-model.number="form.preGlucose" type="number" step="0.1" min="1" max="50" />
          </label>

          <label>
            <span>运动后血糖 (mmol/L)</span>
            <input v-model.number="form.postGlucose" type="number" step="0.1" min="1" max="50" />
          </label>

          <label class="full-row">
            <span>备注</span>
            <textarea v-model="form.notes" rows="3" placeholder="记录运动感受"></textarea>
          </label>

          <div class="form-actions">
            <button type="button" class="ghost-btn" @click="handleClose">取消</button>
            <button type="submit" class="primary-btn" :disabled="saving">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { reactive, watch, ref } from 'vue'
import { EXERCISE_TYPE_OPTIONS, EXERCISE_INTENSITY_OPTIONS } from '@/constants/exercise'
import { CloseIcon } from '@/assets/icons/common'

dayjs.extend(duration)

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  defaultDate: {
    type: Date,
    default: () => new Date()
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit'])

const typeOptions = EXERCISE_TYPE_OPTIONS
const intensityOptions = EXERCISE_INTENSITY_OPTIONS

const form = reactive(createDefaultForm(props.defaultDate))
const timeError = ref('')

function handleClose() {
  emit('close')
}

function validateTimeRange() {
  const start = dayjs(form.startAt)
  const end = dayjs(form.endAt)

  if (start.isAfter(end)) {
    timeError.value = '结束时间不能早于开始时间'
    setTimeout(() => { timeError.value = '' }, 2000)
    return false
  }

  timeError.value = ''
  return true
}

function handleSubmit() {
  if (!validateTimeRange()) return

  emit('submit', {
    ...form,
    startAt: new Date(form.startAt).toISOString(),
    endAt: new Date(form.endAt).toISOString()
  })
}

function createDefaultForm(date) {
  return {
    type: 'aerobic',
    name: '',
    intensity: 'medium',
    startAt: dayjs(date).format('YYYY-MM-DDTHH:mm'),
    endAt: dayjs(date).format('YYYY-MM-DDTHH:mm'),
    duration: 0,
    preGlucose: 5.5,
    postGlucose: 5.5,
    notes: ''
  }
}

function resetForm() {
  Object.assign(form, createDefaultForm(props.defaultDate))
}

watch(() => [form.startAt, form.endAt], ([start, end]) => {
  if (start && end) {
    const diff = dayjs(end).diff(dayjs(start), 'minute')
    if (diff > 0) {
      form.duration = diff
    }
  }
}, { immediate: true }
)

watch(() => props.show, (visible) => {
  if (visible) {
    resetForm()
  }
})

watch(() => props.defaultDate, () => {
  if (props.show) {
    resetForm()
  }
})
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

.form-card {
  max-height: 90vh;
  padding: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  min-height: 0;
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

.form-grid textarea {
  min-height: 80px;
  max-height: 120px;
  resize: vertical;
}

.form-grid input:focus,
.form-grid select:focus,
.form-grid textarea:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.15);
}

.duration-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  background: white;
}

.ghost-btn:hover {
  background: var(--hover-bg);
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

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.primary-btn:not(:disabled):hover {
  background: var(--primary-hover);
}

.error-message {
  display: block;
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
  min-height: 18px;
}
</style>
