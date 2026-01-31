<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>新增记录</h2>
        <button class="close-icon" @click="close">
          <CloseIcon />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modern-form">
        <div class="form-row">
          <div class="input-group">
            <label>血糖数值 (mmol/L)</label>
            <input type="number" min="0" max="100" step="0.1" v-model.number="form.value" placeholder="0.0"
              @blur="handleBloodGlucoseValidation" required />
          </div>
          <div class="input-group">
            <label>测量时间</label>
            <input type="datetime-local" v-model="form.measuredAt" required />
          </div>
        </div>

        <div class="input-group">
          <label>用餐状态</label>
          <div class="chip-grid">
            <button v-for="opt in statusOptions" :key="opt.value" type="button"
              :class="{ active: form.diningStatus === opt.value }" @click="form.diningStatus = opt.value">
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="close">取消</button>
          <button type="submit" class="btn-submit">确认</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import dayjs from 'dayjs'
import { CloseIcon } from '@/icons/common'
import { DINING_STATUS_OPTIONS } from '@/constants/blood_glucose'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  value: 5.5,
  measuredAt: dayjs(new Date()).format('YYYY-MM-DD HH:mm'),
  diningStatus: 'fasting'
})

const statusOptions = DINING_STATUS_OPTIONS

const handleBloodGlucoseValidation = () => {
  const value = form.value.value
  return !isNaN(value) && value >= 0 && value <= 100
}

const close = () => emit('close')

const handleSubmit = () => {
  if (!handleBloodGlucoseValidation()) return
  emit('save', {
    ...form.value,
    measuredAt: new Date(form.value.measuredAt).toISOString()
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(26, 32, 44, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  width: 480px;
  border-radius: 24px;
  padding: 32px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 700;
}

.close-icon {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-icon:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.modern-form label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
  padding: 10px 6px;
}

.modern-form input,
textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
}

.chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-grid button {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.chip-grid button.active {
  background: #3182ce;
  color: white;
  border-color: #3182ce;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.btn-submit {
  flex: 1;
  background: #3182ce;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  flex: 1;
  background: #ee5959;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 12px;
}

.btn-submit:hover {
  background: #2c5282;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-cancel:hover {
  background: #c53030;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>