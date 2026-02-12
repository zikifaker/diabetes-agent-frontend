<template>
  <div class="tool-call-sidebar" :class="{ 'is-visible': visible }">
    <div class="sidebar-inner-content">
      <div class="sidebar-header">
        <h3>工具调用结果</h3>
        <button @click="$emit('close')" class="btn-icon">
          <CloseIcon />
        </button>
      </div>

      <div class="sidebar-content">
        <div v-if="!results || results.length === 0" class="empty-state">
          <p>无调用结果</p>
        </div>

        <div v-else class="tool-call-list">
          <div v-for="(result, index) in results" :key="index" class="tool-call-card">
            <div class="tool-call-title">
              Action {{ index + 1 }}: <br /> {{ result.name }}
            </div>

            <div class="tool-call-result">
              <button class="btn-expand" @click="openJsonModal(result)">⤢</button>

              <JsonViewer :value="parseJSON(result.result)" :expand-depth="2" :show-array-index="false" copyable
                theme="dark" class="custom-json-viewer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="jsonModalVisible" class="json-modal-mask">
      <div class="json-modal">
        <div class="json-modal-header">
          <span>{{ currentToolName }}</span>
          <button class="btn-icon" @click="jsonModalVisible = false">✕</button>
        </div>

        <div class="json-modal-body">
          <JsonViewer :value="currentJson" :expand-depth="5" :show-array-index="false" copyable theme="dark" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import JsonViewer from 'vue-json-viewer'
import 'vue-json-viewer/style.css'
import { CloseIcon } from '@/assets/icons/common'

defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  results: {
    type: Array,
    default: () => []
  }
})

defineEmits(['close'])

const jsonModalVisible = ref(false)
const currentJson = ref(null)
const currentToolName = ref('')

const openJsonModal = (result) => {
  currentJson.value = parseJSON(result.result)
  currentToolName.value = result.name
  jsonModalVisible.value = true
}

const parseJSON = (value) => {
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.map(item =>
        typeof item === 'string' ? parseJSON(item) : item
      )
    }
    return parsed
  } catch {
    return value
  }
}
</script>

<style scoped>
.tool-call-sidebar {
  width: 0;
  height: 100%;
  background: var(--white);
  border-left: 1px solid var(--border-color);
  transition: width 0.3s ease-in-out;
  overflow: hidden;
  flex-shrink: 0;
}

.tool-call-sidebar.is-visible {
  width: 300px;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.05);
}

.sidebar-inner-content {
  width: 300px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
}

.sidebar-header h3 {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
}

.btn-icon {
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.tool-call-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tool-call-card {
  border-radius: 12px;
  overflow: hidden;
  background: var(--white);
}

.tool-call-title {
  padding: 12px 12px;
  font-weight: 500;
  font-size: 13px;
  color: var(--text-primary);
  background: var(--background-color);
  letter-spacing: 0.2px;
}

.tool-call-result {
  position: relative;
  padding: 10px 12px;
  background: #0f172a;
  max-height: 220px;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
}

.tool-call-result::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.tool-call-result::-webkit-scrollbar-track {
  background: transparent;
}

.tool-call-result::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.tool-call-result::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.35);
}

.btn-expand {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #e2e8f0;
  border-radius: 6px;
  padding: 4px 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-expand:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

.json-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.json-modal {
  width: 80vw;
  max-width: 900px;
  height: 80vh;
  background: #020617;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.json-modal-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #e2e8f0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.json-modal-body {
  flex: 1;
  overflow: auto;
  padding: 16px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
}

.json-modal-body::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.json-modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.json-modal-body::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.json-modal-body::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.35);
}

:deep(.jv-container) {
  background: transparent !important;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.4;
}

:deep(.jv-key) {
  color: #7dd3fc;
}

:deep(.jv-string) {
  color: #86efac;
}

:deep(.jv-number) {
  color: #f0abfc;
}

:deep(.jv-boolean) {
  color: #f472b6;
}

:deep(.jv-null),
:deep(.jv-undefined) {
  color: #a78bfa;
}

:deep(.jv-array),
:deep(.jv-object) {
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
