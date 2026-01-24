<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal" role="dialog" aria-modal="true">
      <header class="modal-header">
        <h3>智能体配置</h3>
      </header>

      <section class="modal-body">
        <div class="section">
          <div class="field-row">
            <label for="maxIterations">最大迭代次数</label>
            <div class="field-control">
              <span v-if="showIterationError" class="field-error">
                需在 5–10 之间
              </span>
              <input id="maxIterations" type="number" min="5" max="10" v-model.number="localConfig.maxIterations"
                @blur="handleMaxIterationsValidation" />
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">MCP 工具</div>
          <div class="tools-list">
            <div v-for="tool in toolsOptions" :key="tool.value" class="tool-row">
              <span class="tool-name">{{ tool.label }}</span>

              <label class="switch">
                <input type="checkbox" :value="tool.value" v-model="localConfig.tools" />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <footer class="modal-footer">
        <button class="btn ghost" @click="$emit('close')">取消</button>
        <button class="btn primary" @click="handleSave">保存</button>
      </footer>
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
const showIterationError = ref(false)
const errorTimeout = ref(null)

function handleMaxIterationsValidation() {
  const val = parseInt(localConfig.value.maxIterations, 10)
  const isValid = !isNaN(val) && val >= 5 && val <= 10

  showIterationError.value = !isValid
  if (!isValid) {
    clearTimeout(errorTimeout.value)
    errorTimeout.value = setTimeout(() => {
      showIterationError.value = false
    }, 3000)
  }

  return isValid
}

function handleSave() {
  if (!handleMaxIterationsValidation()) return
  emit('update:config', { ...localConfig.value })
  emit('close')
}

onUnmounted(() => {
  clearTimeout(errorTimeout.value)
})

watch(() => props.show, (isShowing) => {
  if (isShowing) {
    localConfig.value = props.config
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.modal {
  width: 100%;
  max-width: 460px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #111827;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.field-row label {
  font-size: 14px;
  color: #374151;
}

.field-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-control input {
  width: 72px;
  padding: 6px 8px;
  font-size: 14px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
}

.field-error {
  font-size: 12px;
  color: #dc2626;
}

.tools-list {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.tool-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #e5e7eb;
}

.tool-row:last-child {
  border-bottom: none;
}

.tool-name {
  font-size: 14px;
  color: #111827;
}

.switch {
  position: relative;
  width: 36px;
  height: 18px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  inset: 0;
  background: #d1d5db;
  border-radius: 999px;
  transition: 0.2s;
}

.slider::before {
  content: "";
  position: absolute;
  width: 14px;
  height: 14px;
  left: 2px;
  top: 2px;
  background: white;
  border-radius: 50%;
  transition: 0.2s;
}

.switch input:checked+.slider {
  background: var(--primary-color);
}

.switch input:checked+.slider::before {
  transform: translateX(18px);
}

.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #f9fafb;
}

.btn {
  padding: 6px 14px;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
}

.btn.primary {
  background: var(--primary-color);
  color: white;
  border: none;
}

.btn.primary:hover {
  background: var(--primary-hover, #1557b0);
  border-color: var(--primary-hover, #1557b0);
  box-shadow: 0 1px 2px 0 rgba(66, 133, 244, 0.3);
}

.btn.ghost {
  background: transparent;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn.ghost:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: #dadce0;
}
</style>
