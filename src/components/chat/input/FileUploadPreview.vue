<template>
  <div v-if="files.length > 0" class="file-preview-shelf">
    <div v-for="(file, index) in files" :key="index" class="file-item-wrapper">

      <div class="tooltip">{{ file.file.name }}</div>

      <div class="file-card" :class="{ 'is-error': file.error }">
        <div class="file-type-icon" :class="getFileCategory(file.file.name)">
          <component :is="getFileIcon(file.file.name)" />
        </div>

        <div class="file-info">
          <div class="file-name-wrapper">
            <span class="file-name">{{ file.file.name }}</span>
          </div>
          <span class="file-meta" v-if="!file.uploading && !file.error">
            {{ formatFileSize(file.file.size) }}
          </span>
          <span class="status-text error" v-if="file.error">上传失败</span>
          <span class="status-text uploading" v-if="file.uploading">上传中...</span>
        </div>

        <div class="action-area" v-if="!file.uploading">
          <button @click="removeFile(index)" class="inner-delete-btn">
            <CloseIcon />
          </button>
        </div>

        <div v-if="file.uploading" class="upload-spinner-inline">
          <div class="mini-spinner"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { DefaultFileIcon, ImageIcon, CloseIcon } from '@/components/icons'

const props = defineProps({
  files: { type: Array, required: true },
})

const emit = defineEmits(['remove-file'])

const removeFile = (index) => emit('remove-file', index)

const getFileCategory = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'cat-image'
  if (['pdf'].includes(ext)) return 'cat-pdf'
  if (['doc', 'docx', 'txt'].includes(ext)) return 'cat-word'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'cat-excel'
  return 'cat-default'
}

const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase()
  return extension.match(/(jpg|jpeg|png|gif)$/) ? ImageIcon : DefaultFileIcon
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>

<style scoped>
.file-preview-shelf {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px;
  background-color: transparent;
}

.file-item-wrapper {
  position: relative;
  width: 170px;
}

.file-card {
  display: flex;
  align-items: center;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #eef0f2;
  border-radius: 12px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  height: 52px;
  box-sizing: border-box;
}

.file-card:hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.tooltip {
  width: auto;
  min-width: 60px;
  background-color: var(--color-tooltip-bg, #333);
  color: var(--color-tooltip-text, #fff);
  text-align: center;
  border-radius: 4px;
  padding: 8px 8px;
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

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: var(--color-tooltip-bg, #333) transparent transparent transparent;
  }
}

.file-item-wrapper:hover .tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.file-type-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 8px;
}

.cat-image {
  background: #eff6ff;
  color: #3b82f6;
}

.cat-pdf {
  background: #fef2f2;
  color: #ef4444;
}

.cat-excel {
  background: #f0fdf4;
  color: #22c55e;
}

.cat-word {
  background: #f5f3ff;
  color: #8b5cf6;
}

.cat-default {
  background: #f8fafc;
  color: #64748b;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.file-name {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta,
.status-text {
  font-size: 11px;
  color: #94a3b8;
}

.action-area {
  margin-left: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.file-card:hover .action-area {
  opacity: 1;
}

.inner-delete-btn {
  width: 24px;
  height: 24px;
  padding: 5px;
  border: none;
  background: transparent;
  color: #94a3b8;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.inner-delete-btn:hover {
  background-color: #fee2e2;
  color: #ef4444;
}

.mini-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>