<template>
  <div class="file-upload-container">
    <div class="tooltip-container">
      <button @click="triggerFileInput" class="icon-button">
        <FileUploadIcon />
      </button>
      <div class="tooltip">支持上传图片，单次至多 10 个文件，每个不超过 100MB</div>
    </div>
    <input type="file" ref="fileInput" @change="handleFileChange" multiple
      accept="image/png, image/jpeg, image/gif, image/webp" style="display: none" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { FileUploadIcon } from '@/components/icons'

const fileInput = ref(null)

const triggerFileInput = () => {
  fileInput.value.click()
}

const emit = defineEmits(['file-upload'])

const handleFileChange = (event) => {
  const files = event.target.files
  if (!files) return

  emit('file-upload', files)
  event.target.value = ''
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

.icon-button:hover {
  color: var(--color-primary, #409eff);
}

.tooltip-container {
  position: relative;
  display: inline-block;
}

.tooltip-container:hover .tooltip {
  visibility: visible;
  opacity: 1;
  transform: translateX(-50%) translateY(0);
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
</style>
