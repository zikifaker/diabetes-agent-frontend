<template>
  <div class="llm-selector">
    <button @click.stop="toggleDropdown" class="btn-llm" :class="{ 'active': showDropdown }"
      :aria-expanded="showDropdown" aria-haspopup="listbox" :aria-label="`Selected model: ${selectedLLM.name}`">
      <div class="selected-model">
        <div class="model-info">
          <div class="model-name">{{ selectedLLM.name }}</div>
        </div>
      </div>
      <LLMSelectorToggleIcon />
    </button>

    <div v-if="showDropdown" class="llm-dropdown" role="listbox">
      <div v-for="llm in llmOptions" :key="llm.id" @click="selectLLM(llm)" class="llm-option"
        :class="{ 'selected': llm.id === selectedLLM.id }" role="option" :aria-selected="llm.id === selectedLLM.id"
        tabindex="0" @keydown.enter="selectLLM(llm)" @keydown.space.prevent="selectLLM(llm)">
        <div class="option-content">
          <div class="option-info">
            <div class="option-name">{{ llm.name }}</div>
            <div class="option-desc">{{ llm.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { LLMSelectorToggleIcon } from '@/assets/icons/chat/input'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  llmOptions: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const showDropdown = ref(false)
const selectedLLM = ref(props.modelValue)

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function selectLLM(llm) {
  selectedLLM.value = llm
  emit('update:modelValue', llm)
  showDropdown.value = false
}

function handleClickOutside(event) {
  const el = document.querySelector('.llm-selector')
  if (el && !el.contains(event.target)) {
    showDropdown.value = false
  }
}

function handleEscape(event) {
  if (event.key === 'Escape') {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})

watch(() => props.modelValue, (newVal) => {
  if (newVal.id !== selectedLLM.value.id) {
    selectedLLM.value = newVal
  }
}, { deep: true })
</script>

<style scoped>
.llm-selector {
  position: relative;
  display: inline-block;
}

.btn-llm {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: var(--bg-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-width: 200px;
  gap: 8px;
}

.btn-llm:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.btn-llm.active {
  background-color: rgba(0, 0, 0, 0.05);
  border-color: var(--primary-color);
}

.selected-model {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.model-info {
  min-width: 0;
}

.model-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


.llm-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 320px;
  max-height: 400px;
  overflow-y: auto;
  background: var(--hover-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  margin-top: 4px;
  padding: 8px;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.llm-option {
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  border-radius: 8px;
  margin-bottom: 4px;
  background-color: transparent;
}

.llm-option:last-child {
  margin-bottom: 0;
}

.llm-option:hover,
.llm-option:focus {
  background-color: rgba(0, 0, 0, 0.05);
  outline: none;
  transform: none;
  border-color: transparent;
}

.llm-option.selected {
  background-color: var(--primary-color-10);
}

.llm-option.selected .option-name {
  color: var(--primary-color);
  font-weight: 600;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.option-info {
  flex: 1;
  min-width: 0;
}

.option-name {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
  font-size: 14px;
}

.option-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.llm-dropdown::-webkit-scrollbar {
  width: 6px;
}

.llm-dropdown::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 3px;
}

.llm-dropdown::-webkit-scrollbar-thumb {
  background-color: var(--border-color);
  border-radius: 3px;
}

.llm-dropdown::-webkit-scrollbar-thumb:hover {
  background-color: var(--text-tertiary);
}
</style>
