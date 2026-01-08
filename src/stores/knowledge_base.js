import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import { NAMESPACE, getUploadPolicyToken, uploadToOSS } from '@/utils/oss'

export const useKnowledgeBaseStore = defineStore('knowledgeBase', () => {
  const knowledgeFiles = ref([])
  const cachedKnowledgeFiles = ref([])
  const loading = ref(false)
  const uploading = ref(false)

  async function fetchFiles(force = false) {
    // 有缓存且不强制刷新，直接恢复
    if (!force && cachedKnowledgeFiles.value.length > 0) {
      knowledgeFiles.value = cachedKnowledgeFiles.value
      return
    }

    loading.value = true

    try {
      const response = await api.get('/kb/metadata')
      const metadata = response.data.data.metadata || []

      const files = metadata.map(item => ({
        fileName: item.file_name,
        fileType: item.file_type,
        fileSize: item.file_size,
      }))

      cachedKnowledgeFiles.value = files
      knowledgeFiles.value = files
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  async function uploadFile(file) {
    uploading.value = true
    try {
      const policyToken = await getUploadPolicyToken(file.name, NAMESPACE.KNOWLEDGE_BASE)

      const response = await uploadToOSS(file, policyToken)
      if (!response.ok) {
        throw new Error('failed to upload file to OSS')
      }

      await api.post('/kb/metadata', {
        file_name: file.name,
        file_type: file.name.split('.').pop().toLowerCase(),
        file_size: file.size,
        object_name: policyToken.key
      })
    } catch (error) {
      throw error
    } finally {
      uploading.value = false
    }
  }

  async function deleteFile(fileName) {
    try {
      await api.delete('/kb/metadata', {
        params: { 'file-name': fileName }
      })

      cachedKnowledgeFiles.value = cachedKnowledgeFiles.value.filter(f => f.fileName !== fileName)
      knowledgeFiles.value = knowledgeFiles.value.filter(f => f.fileName !== fileName)

      return { success: true, message: '文件删除成功' }
    } catch (error) {
      throw error
    }
  }

  async function searchFiles(query) {
    try {
      const response = await api.get('/kb/metadata/search', {
        params: { 'query': query }
      })
      const metadata = response.data.data.metadata || []
      knowledgeFiles.value = metadata.map(item => ({
        fileName: item.file_name,
        fileType: item.file_type,
        fileSize: item.file_size,
      }))
    } catch (error) {
      throw error
    }
  }

  function resetFiles() {
    knowledgeFiles.value = cachedKnowledgeFiles.value
  }

  function validateFileType(file) {
    const allowedTypes = [
      'application/pdf',
      'text/markdown',
      'text/plain'
    ]
    const allowedExtensions = ['.pdf', '.md', '.txt']
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    return allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)
  }

  return {
    knowledgeFiles,
    loading,
    uploading,
    fetchFiles,
    uploadFile,
    deleteFile,
    searchFiles,
    resetFiles,
    validateFileType
  }
})
