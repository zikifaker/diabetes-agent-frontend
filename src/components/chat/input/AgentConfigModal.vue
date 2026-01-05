<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="agent-config-title">
      <div class="config-header">
        <h3 id="agent-config-title">智能体配置</h3>
      </div>

      <div class="config-content">
        <div class="config-group config-row">
          <div class="iteration-controls">
            <label for="maxIterations">最大迭代次数:</label>
            <input id="maxIterations" v-model.number="localMaxIterations" type="number" min="5" max="10"
              class="iteration-input" @blur="handleMaxIterationsBlur">
            <span v-if="showIterationError" class="iteration-error">需在5-10之间</span>
          </div>
        </div>

        <div class="config-group">
          <label>工具</label>
          <div class="tools-list">
            <div v-for="tool in toolsOptions" :key="tool.value" class="tool-item">
              <span class="tool-name">{{ tool.label }}</span>
              <label class="switch">
                <input type="checkbox" :value="tool.value" v-model="localConfig.tools" class="sr-only">
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="config-footer">
        <button class="btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn-primary" @click="handleSave">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  config: {
    type: Object,
    required: true
  },
  toolsOptions: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:config', 'close'])

const localConfig = ref({ ...props.config })
const localMaxIterations = ref(props.config.maxIterations)
const showIterationError = ref(false)
const errorTimeout = ref(null)

watch(() => props.config, (newVal) => {
  localConfig.value = { ...newVal }
  localMaxIterations.value = newVal.maxIterations
}, { deep: true, immediate: true })

function handleMaxIterationsBlur() {
  const value = parseInt(localMaxIterations.value)

  if (isNaN(value) || value < 5 || value > 10) {
    showIterationError.value = true

    if (errorTimeout.value) {
      clearTimeout(errorTimeout.value)
    }

    const correctedValue = value < 5 ? 5 : 10
    localMaxIterations.value = correctedValue
    localConfig.value.maxIterations = correctedValue

    errorTimeout.value = setTimeout(() => {
      showIterationError.value = false
    }, 3000)
  } else {
    showIterationError.value = false
    localConfig.value.maxIterations = value
  }
}

function handleSave() {
  emit('update:config', { ...localConfig.value })
  emit('close')
}

onUnmounted(() => {
  if (errorTimeout.value) {
    clearTimeout(errorTimeout.value)
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1100;
  backdrop-filter: blur(2px);
}

.modal-content {
  width: 100%;
  max-width: 480px;
  background: var(--white);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: modalFadeIn 0.2s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.config-header h3 {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

.btn-close {
  padding: 8px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: rgba(0, 0, 0, 0.04);
}

.config-content {
  padding: 20px 24px;
}

.config-group {
  margin-bottom: 24px;
}

.config-group:last-child {
  margin-bottom: 0;
}

.config-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.iteration-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.iteration-controls label {
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  white-space: nowrap;
}

.iteration-input {
  width: 80px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
  height: 20px;
  line-height: 1;
  box-sizing: content-box;
}

.iteration-error {
  color: #ef4444;
  font-size: 12px;
  white-space: nowrap;
}

.tools-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.tools-list::-webkit-scrollbar {
  width: 6px;
}

.tools-list::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.tools-list::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.tools-list::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.tool-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--white);
  transition: all 0.2s ease;
}

.tool-name {
  font-size: 14px;
  color: var(--text-primary);
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked+.slider {
  background-color: var(--primary-color);
}

input:focus+.slider {
  box-shadow: 0 0 1px var(--primary-color);
}

input:checked+.slider:before {
  transform: translateX(20px);
}

.config-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--primary-color);
  color: rgb(255, 255, 255);
  border: 1px solid var(--primary-color);
}

.btn-primary:hover {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-secondary {
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background-color: var(--bg-hover);
}
</style>
