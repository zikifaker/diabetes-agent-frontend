import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useKnowledgeBaseStore = defineStore('knowledgeBase', () => {
  const knowledgeFiles = ref([])
  const loading = ref(false)
  const uploading = ref(false)

  async function fetchFiles() {
    loading.value = true
    try {
      const response = await api.get('/kb/metadata')
      const metadata = response.data.data.metadata || []
      knowledgeFiles.value = metadata.map(item => ({
        fileName: item.file_name,
        fileType: item.file_type,
        fileSize: item.file_size,
      }))
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  async function uploadFile(file) {
    uploading.value = true
    try {
      const { data: { data: policyToken } } = await api.get('/oss/policy-token')

      const formData = new FormData()
      formData.append("success_action_status", "200")
      formData.append("policy", policyToken.policy)
      formData.append("x-oss-signature", policyToken.signature)
      formData.append("x-oss-signature-version", "OSS4-HMAC-SHA256")
      formData.append("x-oss-credential", policyToken.x_oss_credential)
      formData.append("x-oss-date", policyToken.x_oss_date)
      formData.append("key", policyToken.dir + file.name)
      formData.append("x-oss-security-token", policyToken.security_token)
      formData.append("file", file)

      const uploadResponse = await fetch(policyToken.host, {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('failed to upload file to OSS')
      }

      await api.post('/kb/metadata', {
        file_name: file.name,
        file_type: file.name.split('.').pop().toLowerCase(),
        file_size: file.size,
        object_name: policyToken.dir + file.name
      })

      await fetchFiles()

      return { success: true, message: '文件上传成功' }
    } catch (error) {
      throw error
    } finally {
      uploading.value = false
    }
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

  async function deleteFile(fileName) {
    try {
      await api.delete('/kb/metadata', {
        params: { 'file-name': fileName }
      })
      const index = knowledgeFiles.value.findIndex(f => f.fileName === fileName)
      if (index !== -1) {
        knowledgeFiles.value.splice(index, 1)
      }
      return { success: true, message: '文件删除成功' }
    } catch (error) {
      throw error
    }
  }

  async function fetchFileDownloadLink(fileName) {
    try {
      const response = await api.get('/kb/download-link', {
        params: { 'file-name': fileName }
      })

      return response.data.data.url
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

  return {
    knowledgeFiles,
    loading,
    uploading,
    fetchFiles,
    uploadFile,
    deleteFile,
    fetchFileDownloadLink,
    searchFiles,
    validateFileType
  }
})
