<template>
  <div class="file-upload-container">
    <div class="tooltip-container" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false">
      <button @click="triggerFileInput" class="icon-button" :disabled="disabled" :class="{ 'disabled': disabled }">
        <FileUploadIcon :class="{ 'disabled-icon': disabled }" />
      </button>
      <div class="tooltip" :class="{ 'tooltip-visible': showTooltip && !disabled }" v-if="!disabled">
        支持 PNG / JPG / JEPG / GIF / WEBP / Word / PDF / Excel / txt / Markdown<br />单次上传至多 10 个文件，每个不超过 100MB
      </div>
      <div class="tooltip" :class="{ 'tooltip-visible': showTooltip && disabled }" v-else>
        当前页面不支持上传文件
      </div>
    </div>
    <input type="file" ref="fileInput" @change="handleFileChange" style="display: none" accept="
    image/png, .png,
    image/jpeg, .jpg, .jpeg,
    image/gif, .gif,
    image/webp, .webp,
    application/msword, .doc,
    application/vnd.openxmlformats-officedocument.wordprocessingml.document, .docx,
    application/pdf, .pdf,
    application/vnd.ms-excel, .xls,
    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .xlsx,
    text/plain, .txt,
    text/markdown, .md
  " multiple>

    <div v-if="toast.show" class="toast" :class="{ 'toast-error': toast.type === 'error' }">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { FileUploadIcon } from '@/assets/icons/chat/input'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['file-upload'])

const fileInput = ref(null)
const showTooltip = ref(false)

const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

const triggerFileInput = () => {
  showTooltip.value = false
  fileInput.value.click()
}

const handleFileChange = (event) => {
  const files = Array.from(event.target.files)
  if (files.length === 0) return

  if (files.length > 10) {
    showToast('单次至多上传10个文件', 'error')
    event.target.value = ''
    return
  }

  const maxSize = 100 * 1024 * 1024
  const oversizedFiles = files.filter(file => file.size > maxSize)
  if (oversizedFiles.length > 0) {
    showToast(`每个文件不超过100MB`, 'error')
    event.target.value = ''
    return
  }

  emit('file-upload', files)
  event.target.value = ''
}

function showToast(message, type) {
  toast.value = {
    show: true,
    message,
    type
  }
  setTimeout(() => {toast.value.show = false}, 1500)
}
</script>

<style scoped>
.file-upload-container {
  display: flex;
  align-items: center;
}

.icon-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary, #606266);
  transition: color 0.2s ease-in-out;
}

.icon-button:hover:not(:disabled) {
  background-color: var(--color-hover-bg);
  transform: translateY(-1px);
}

.icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.disabled-icon {
  opacity: 0.6;
}

.tooltip-container {
  position: relative;
  display: inline-block;
}

.tooltip {
  visibility: hidden;
  width: auto;
  min-width: 60px;
  background-color: var(--color-tooltip-bg, #333);
  color: var(--color-tooltip-text, #fff);
  text-align: center;
  border-radius: 4px;
  padding: 4px 8px;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%) translateY(5px);
  opacity: 0;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tooltip.tooltip-visible {
  visibility: visible;
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: var(--color-tooltip-bg, #333) transparent transparent transparent;
}

.toast {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 0.875rem;
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
  transition: all 0.3s ease;
}

.toast-error {
  background-color: rgba(254, 242, 242, 0.9);
  border: 1px solid #ef4444;
  color: #991b1b;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
