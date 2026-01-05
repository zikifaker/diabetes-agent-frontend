<template>
  <div class="llm-selector">
    <button @click.stop="toggleDropdown" class="btn-llm" :class="{ 'active': showDropdown }"
      :aria-expanded="showDropdown" aria-haspopup="listbox" :aria-label="`Selected model: ${selectedLLM.name}`">
      {{ selectedLLM.name }}
      <LLMSelectorToggleIcon :show-dropdown="showDropdown" />
    </button>

    <div v-if="showDropdown" class="llm-dropdown" role="listbox">
      <div v-for="llm in llmOptions" :key="llm.id" @click="selectLLM(llm)" class="llm-option"
        :class="{ 'selected': llm.id === selectedLLM.id }" role="option" :aria-selected="llm.id === selectedLLM.id"
        tabindex="0" @keydown.enter="selectLLM(llm)" @keydown.space.prevent="selectLLM(llm)">
        <div class="llm-name">{{ llm.name }}</div>
        <div class="llm-desc">{{ llm.description }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { LLMSelectorToggleIcon } from '@/components/icons'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  llmOptions: {
    type: Array,
    required: true,
    validator: (value) => {
      return value.every(option =>
        option.id &&
        option.name &&
        option.description
      )
    }
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
  gap: 8px;
  padding: 6px 12px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  justify-content: space-between;
}

.btn-llm:hover,
.btn-llm.active {
  background-color: var(--primary-color-10);
  border-color: var(--primary-color-20);
  color: var(--primary-color);
}

.btn-llm:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  border-color: var(--primary-color);
}

.llm-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 280px;
  max-height: 300px;
  overflow-y: auto;
  background: var(--white);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-bottom: 8px;
  padding: 8px 0;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.llm-option {
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.15s ease;
  border-radius: 4px;
  margin: 2px 8px;
}

.llm-option:hover,
.llm-option:focus {
  background-color: var(--bg-hover);
  outline: none;
}

.llm-option.selected {
  background-color: var(--primary-color-10);
}

.llm-option.selected .llm-name {
  color: var(--primary-color);
  font-weight: 500;
}

.llm-name {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.llm-desc {
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
