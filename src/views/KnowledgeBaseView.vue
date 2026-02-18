<template>
  <div class="knowledge-base-container">
    <div class="header">
      <h4 class="page-title">我的知识库</h4>
      <div class="header-actions">
        <div class="search-expand" :class="{ active: searchActive }" @click.stop>
          <input v-if="searchActive" v-model="searchQuery" class="search-input" placeholder="搜索文件"
            @keyup.enter="handleSearch" />

          <button class="search-trigger" @click="handleSearchClick">
            <CloseIcon v-if="searchActive && searchQuery" @click.stop="clearSearch" />
            <SearchIcon v-else />
            <span v-if="!searchActive">搜索文件</span>
          </button>
        </div>

        <div class="tooltip-container">
          <button class="action-btn upload-btn" @click="triggerFileUpload" :disabled="uploading">
            <UploadIcon />
            {{ uploading ? '上传中...' : '上传文件' }}
          </button>
          <div class="tooltip">
            支持 PDF / text / Markdown <br />单次上传至多 10 个文件<br />每个不超过 100MB
          </div>
        </div>

        <input ref="fileInput" type="file" @change="handleFileUpload" accept=".pdf,.md,.txt" style="display: none"
          multiple />
      </div>
    </div>

    <div class="content">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="knowledgeFiles.length === 0" class="empty-state">
        <EmptyStateIcon />
        <p class="empty-state-text">暂无文件，请上传文件开始使用</p>
      </div>

      <div v-else class="files-grid">
        <div v-for="file in knowledgeFiles" :key="file.fileName" class="file-card">
          <div class="card-actions" :class="{ 'menu-open': activeFileMenu === file.fileName }">
            <button class="menu-trigger" @click.stop="toggleFileMenu(file.fileName)">
              <MenuIcon />
            </button>
            <div v-if="activeFileMenu === file.fileName" class="file-menu">
              <div class="menu-item" @click="handleDownload(file.fileName)">下载</div>
              <div class="menu-item danger" @click="handleDelete(file.fileName)">删除</div>
            </div>
          </div>
          <div>
            <div v-if="file.fileType === 'pdf'" class="file-thumbnail pdf-thumbnail">
              <span class="file-extension">PDF</span>
            </div>
            <div v-else-if="file.fileType === 'md'" class="file-thumbnail md-thumbnail">
              <span class="file-extension">Markdown</span>
            </div>
            <div v-else class="file-thumbnail default-thumbnail">
              <span class="file-extension">{{ getFileExtension(file.fileName) }}</span>
            </div>
          </div>
          <div class="file-info">
            <div class="file-name">{{ file.fileName }}</div>
            <div class="file-meta">{{ formatFileSize(file.fileSize) }}</div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
        <div class="modal-content">
          <div class="modal-header">
            <h3>确认删除文件吗？</h3>
            <button @click="cancelDelete" class="close-button">
              <CloseIcon />
            </button>
          </div>
          <div class="modal-body">
            <p>删除后文件将无法恢复，请谨慎操作</p>
          </div>
          <div class="modal-footer">
            <button @click="cancelDelete" class="btn btn-cancel">取消</button>
            <button @click="confirmDelete" class="btn btn-delete-confirm">删除</button>
          </div>
        </div>
      </div>
    </Teleport>

    <div v-if="toast.show" class="toast"
      :class="{ 'toast-success': toast.type === 'success', 'toast-error': toast.type === 'error' }">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useKnowledgeBaseStore } from '@/stores/knowledge_base'
import { storeToRefs } from 'pinia'
import { SearchIcon, UploadIcon, EmptyStateIcon } from '@/assets/icons/knowledge-base'
import { CloseIcon, MenuIcon } from '@/assets/icons/common'
import { getPresignedURL, NAMESPACE } from '@/utils/oss'

const knowledgeBaseStore = useKnowledgeBaseStore()
const { knowledgeFiles, loading, uploading } = storeToRefs(knowledgeBaseStore)

const searchActive = ref(false)
const searchQuery = ref('')

const fileInput = ref(null)
const fileToDelete = ref(null)
const showDeleteModal = ref(false)
const activeFileMenu = ref(null)

const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

async function handleSearch() {
  if (!searchQuery.value.trim()) return

  try {
    await knowledgeBaseStore.searchFiles(searchQuery.value)
  } catch (error) {
    console.error('Failed to search files:', error)
  }
}

function handleSearchClick() {
  if (searchActive.value && searchQuery.value) {
    clearSearch()
    return
  }

  if (searchActive.value && !searchQuery.value) {
    deactivateSearch()
    return
  }

  activateSearch()
}

function clearSearch() {
  searchQuery.value = ''
  knowledgeBaseStore.resetFiles()
}

function deactivateSearch() {
  searchActive.value = false
  searchQuery.value = ''
  knowledgeBaseStore.resetFiles()
}

function activateSearch() {
  searchActive.value = true
}

function triggerFileUpload() {
  fileInput.value?.click()
}

async function handleFileUpload(event) {
  const files = Array.from(event.target.files)
  if (files.length === 0) return

  if (files.length > 10) {
    showToast('单次至多上传10个文件', 'error')
    event.target.value = ''
    return
  }

  // 上传的单个文件大小上限为 100 MB
  const maxSize = 100 * 1024 * 1024
  const oversizedFiles = files.filter(file => file.size > maxSize)
  if (oversizedFiles.length > 0) {
    showToast(`每个文件不超过100MB`, 'error')
    event.target.value = ''
    return
  }

  // 并行上传
  const uploadPromises = files.map(async (file) => {
    if (!knowledgeBaseStore.validateFileType(file)) {
      return {
        success: false,
        message: `文件 ${file.name} 格式不支持`
      }
    }

    try {
      await knowledgeBaseStore.uploadFile(file)
      return { success: true }
    } catch (error) {
      console.error(`Failed to upload file ${file.name}:`, error)
      return {
        success: false,
        message: `文件 ${file.name} 上传失败`
      }
    }
  })

  let successCount = 0
  try {
    const results = await Promise.all(uploadPromises)
    successCount = results.filter(r => r?.success).length

    if (successCount > 0) {
      showToast(`成功上传 ${successCount} 个文件`, 'success')
    }

    results.forEach((result) => {
      if (!result?.success && result?.message) {
        showToast(result.message, 'error')
      }
    })
  } catch (error) {
    console.error('Error uploading multiple files:', error)
  } finally {
    event.target.value = ''
  }

  // 若存在文件上传成功，刷新文件列表
  if (successCount > 0) {
    try {
      await knowledgeBaseStore.fetchFiles(true)
    } catch (error) {
      console.error('Failed to fetch knowledge metadata:', error)
    }
  }
}

function showToast(message, type = 'success') {
  toast.value = {
    show: true,
    message,
    type
  }
  setTimeout(() => { toast.value.show = false }, 1500)
}

function toggleFileMenu(fileName) {
  activeFileMenu.value = activeFileMenu.value === fileName ? null : fileName
}

async function handleDownload(fileName) {
  activeFileMenu.value = null
  try {
    const url = await getPresignedURL(fileName, NAMESPACE.KNOWLEDGE_BASE)
    const link = document.createElement('a')
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('文件下载成功', 'success')
  } catch (error) {
    console.error('Failed to download file:', error)
    showToast('文件下载失败', 'error')
  }
}

function handleDelete(fileName) {
  activeFileMenu.value = null
  fileToDelete.value = fileName
  showDeleteModal.value = true
}

function getFileExtension(filename) {
  return filename.split('.').pop().toUpperCase();
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function cancelDelete() {
  showDeleteModal.value = false
  fileToDelete.value = null
}

async function confirmDelete() {
  if (fileToDelete.value) {
    try {
      await knowledgeBaseStore.deleteFile(fileToDelete.value)
      showToast('文件删除成功', 'success')
    } catch (error) {
      console.error('Failed to delete file:', error)
      showToast('删除文件失败', 'error')
    }
    showDeleteModal.value = false
    fileToDelete.value = null
  }
}

function handleGlobalClick() {
  activeFileMenu.value = null
  if (searchActive.value && !searchQuery.value) {
    searchActive.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', handleGlobalClick)
  try {
    await knowledgeBaseStore.fetchFiles(true)
  } catch (error) {
    console.error('Failed to fetch knowledge metadata:', error)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
})
</script>

<style scoped>
.knowledge-base-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f4f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-color);
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-expand {
  display: flex;
  align-items: center;
  height: 40px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: var(--white);
  overflow: hidden;
  transition: width 0.25s ease, border-color 0.25s ease;
  width: 110px;
}

.search-expand:hover {
  background: var(--hover-bg);
}

.search-expand.active {
  width: 260px;
  border-color: var(--primary-color);
}

.search-input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 12px;
  font-size: 14px;
  color: var(--text-primary);
  padding-right: 30px;
}

.search-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  padding: 0 12px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.search-trigger:hover {
  background: var(--hover-bg);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: var(--white);
  color: var(--text-primary);
  font-size: 14px;
  transition: var(--transition);
  cursor: pointer;
}

.action-btn:hover:not(:disabled) {
  background: var(--hover-bg);
  border-color: var(--primary-color);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: var(--white);
  border-color: var(--primary-color);
}

.tooltip-container {
  position: relative;
  display: inline-block;
}

.tooltip {
  visibility: hidden;
  min-width: 60px;
  background-color: var(--color-tooltip-bg, #333);
  color: var(--color-tooltip-text, #fff);
  text-align: center;
  border-radius: 4px;
  padding: 4px 8px;
  position: absolute;
  z-index: 50;
  top: 125%;
  left: 50%;
  transform: translateX(-50%) translateY(-5px);
  opacity: 0;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tooltip-container:hover .tooltip {
  visibility: visible;
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.tooltip::after {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: transparent transparent var(--color-tooltip-bg, #333) transparent;
}

.content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: var(--text-secondary);
}

.empty-state-text {
  margin-top: 16px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  padding: 12px;
}

.file-card {
  position: relative;
  width: 140px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  background: white;
  cursor: pointer;
}

.card-actions {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.file-card:hover .card-actions {
  opacity: 1;
}

.card-actions.menu-open {
  opacity: 1;
}

.menu-trigger {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #374151;
}

.menu-trigger:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.file-menu {
  position: absolute;
  right: 0;
  transform: none;
  background: #ffffff;
  border-radius: 8px;
  padding: 4px;
  min-width: 80px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  border: 1px solid var(--border-color);
  z-index: 20;
}

.menu-item {
  padding: 3px 6px;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
}

.menu-item:hover {
  background-color: #f6f5f3c5;
}

.menu-item.danger {
  color: #ef4444;
}

.file-thumbnail {
  position: relative;
  width: 100%;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.file-extension {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

.pdf-thumbnail {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.md-thumbnail {
  background: linear-gradient(135deg, #10b981, #059669);
}

.default-thumbnail {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
}

.file-info {
  padding: 8px;
  border-top: 1px solid #f3f4f6;
}

.file-name {
  font-weight: 500;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #111827;
  margin-bottom: 4px;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #6b7280;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #ffffff;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-primary);
}

.close-button {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-button:hover {
  color: var(--text-primary);
  background-color: var(--hover-bg);
}

.modal-body {
  padding: 20px;
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-cancel {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.btn-cancel:hover {
  background-color: var(--hover-bg);
}

.btn-delete-confirm {
  background-color: #ef4444;
  color: white;
}

.btn-delete-confirm:hover {
  background-color: #dc2626;
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

.toast-success {
  background-color: rgba(236, 253, 245, 0.9);
  border: 1px solid #10b981;
  color: #065f46;
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