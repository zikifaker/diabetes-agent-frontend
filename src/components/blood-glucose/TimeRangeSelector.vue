<template>
  <div class="selector-container">
    <div class="selector-wrapper">
      <div class="range-selector">
        <button v-for="opt in options" :key="opt.value" :class="{ active: rangeType === opt.value }"
          @click="handleTypeChange(opt.value)">
          {{ opt.label }}
        </button>
      </div>

      <transition name="slide-fade">
        <div v-if="rangeType === 'custom'" class="custom-panel">
          <div class="divider"></div>
          <div class="date-input-group">
            <input type="date" :value="formatLocalDate(customRange.start)"
              @change="e => updateRange('start', e.target.value)" />
            <span class="separator">至</span>
            <input type="date" :value="formatLocalDate(customRange.end)" @change="e => updateRange('end', e.target.value)" />
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  rangeType: {
    type: String,
    default: '1d'
  },
  customRange: Object
})

const emit = defineEmits(['update:rangeType', 'update:customRange'])

const options = [
  { label: '近1天', value: '1d' },
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
  { label: '自定义', value: 'custom' }
]

const formatLocalDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const handleTypeChange = (value) => {
  emit('update:rangeType', value)
}

const updateRange = (type, value) => {
  const newRange = { ...props.customRange }
  const d = new Date(value)
  if (type === 'start') {
    d.setHours(0, 0, 0, 0)
    newRange.start = d
  } else {
    d.setHours(23, 59, 59, 999)
    newRange.end = d
  }
  emit('update:customRange', newRange)
}
</script>

<style scoped>
.selector-container {
  margin-bottom: 24px;
}

.selector-wrapper {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.range-selector {
  display: flex;
  gap: 8px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 24px;
}

.range-selector button {
  background: transparent;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  color: #64748b;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.range-selector button.active {
  background: white;
  color: #3182ce;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.custom-panel {
  display: flex;
  align-items: center;
  gap: 16px;
}

.divider {
  width: 1px;
  height: 20px;
  background: #e2e8f0;
}

.date-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-input-group input {
  border: 1px solid #e2e8f0;
  padding: 6px 10px;
  border-radius: 8px;
  color: #475569;
  font-size: 13px;
  background-color: white;
  outline: none;
  transition: border-color 0.2s;
}

.date-input-group input:focus {
  border-color: #3182ce;
}

.separator {
  color: #94a3b8;
  font-size: 12px;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}
</style>