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
              <div class="tool-info">
                <span class="tool-name">{{ tool.label }}</span>
                <span class="info-tooltip" :data-description="tool.description">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </span>
              </div>

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
  border-radius: 8px;
}

.tool-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
}

.tool-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tool-name {
  font-size: 14px;
  color: #111827;
}

.info-tooltip {
  display: flex;
  align-items: center;
  color: #9ca3af;
  position: relative;
}

.info-tooltip:hover {
  color: #6b7280;
}

.info-tooltip::after {
  content: attr(data-description);
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #1f2937;
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  width: max-content;
  max-width: 200px;
  word-wrap: break-word;
  white-space: normal;
  line-height: 1.4;
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.info-tooltip:hover::after,
.info-tooltip:hover::before {
  opacity: 1;
  visibility: visible;
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
