<template>
  <div class="chat-input-container">
    <AgentConfigModal v-model:show="showConfig" v-model:config="agentConfig" :tools-options="toolsOptions"
      @close="showConfig = false" />

    <div class="input-area">
      <div class="input-pill">
        <FileUploadPreview :files="uploadedFiles" @remove-file="removeFile" />

        <div class="input-content">
          <textarea ref="textareaRef" v-model="message" @keydown.enter.exact.prevent="handleSend"
            @keydown.shift.enter.stop @input="autoResize" :placeholder="placeholder" rows="1" class="message-input"
            :disabled="loading" :aria-label="placeholder"></textarea>
        </div>

        <div class="input-controls">
          <div class="left-controls">
            <LLMSelector v-model:modelValue="selectedLLM" :llm-options="llmOptions" class="llm-selector" />

            <div class="tooltip-container">
              <button @click="showConfig = true" class="btn-config" aria-label="智能体配置">
                <AgentConfigIcon />
                <span class="tooltip">智能体配置</span>
              </button>
            </div>
          </div>

          <div class="right-controls">
            <FileUploadButton @file-upload="handleFileUpload" />

            <VoiceInputButton v-model:isListening="isListening" @result="handleVoiceResult" class="voice-input-btn" />

            <div class="tooltip-container">
              <button v-if="!loading" @click="handleSend" class="btn-send"
                :disabled="!message.trim() && uploadedFiles.length === 0"
                :aria-label="(message.trim() || uploadedFiles.length > 0) ? '发送消息' : '请输入消息内容'">
                <SendIcon />
                <span class="tooltip">发送消息</span>
              </button>
              <button v-else @click="handleStop" class="btn-stop" aria-label="停止生成">
                <StopIcon />
                <span class="tooltip">停止生成</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AgentConfigModal from '@/components/chat/input/AgentConfigModal.vue'
import LLMSelector from '@/components/chat/input/LLMSelector.vue'
import VoiceInputButton from '@/components/chat/input/VoiceInputButton.vue'
import FileUploadButton from '@/components/chat/input/FileUploadButton.vue'
import FileUploadPreview from '@/components/chat/input/FileUploadPreview.vue'
import { AgentConfigIcon, SendIcon, StopIcon } from '@/components/icons'
import { getUploadPolicyToken, uploadToOSS, NAMESPACE } from '@/utils/oss.js'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: '请输入内容...'
  }
})

const emit = defineEmits(['send', 'stop'])

const route = useRoute()

const message = ref('')
const showConfig = ref(false)
const textareaRef = ref(null)
const isListening = ref(false)
const uploadedFiles = ref([])

const llmOptions = ref([
  {
    id: 'qwen3-max',
    name: '通义千问3-max',
    description: '适配复杂场景，达到领域 SOTA 水平'
  },
  {
    id: 'qwen-flash',
    name: '通义千问-Flash',
    description: '小尺寸模型，快速响应'
  }
])

const selectedLLM = ref(llmOptions.value[0])

const toolsOptions = ref([
  {
    label: '糖尿病知识图谱',
    value: 'search_diabetes_knowledge_graph',
  },
  {
    label: '个人知识库',
    value: 'search_user_knowledge_base',
  }
])

const agentConfig = ref({
  maxIterations: 5,
  tools: ['search_diabetes_knowledge_graph']
})

function handleSend() {
  if ((!message.value.trim() && uploadedFiles.value.length === 0) || props.loading) return

  emit('send', {
    message: message.value,
    uploaded_files: uploadedFiles.value.map(file => ({
      fileName: file.file.name,
    })),
    agentConfig: {
      ...agentConfig.value,
      model: selectedLLM.value.id
    }
  })

  message.value = ''
  uploadedFiles.value = []

  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
      textareaRef.value.style.minHeight = '24px'
    }
  })
}

function handleStop() {
  emit('stop')
}

function autoResize() {
  if (textareaRef.value) {
    const el = textareaRef.value
    el.style.height = 'auto'
    const maxHeight = 150
    const newHeight = Math.min(el.scrollHeight, maxHeight)
    el.style.height = newHeight + 'px'
  }
}

function handleVoiceResult(results) {
  if (results && results.length > 0) {
    const transcript = results[0].transcript
    message.value = message.value ? `${message.value} ${transcript}` : transcript
    nextTick(() => autoResize())
  }
}

const handleFileUpload = async (files) => {
  const newFiles = Array.from(files).map(file => ({
    file,
    uploading: true,
    error: false,
  }));
  uploadedFiles.value = [...uploadedFiles.value, ...newFiles]

  for (let i = 0; i < newFiles.length; i++) {
    // 计算新文件在文件列表的下标，确保正确更新文件状态
    const index = uploadedFiles.value.length - newFiles.length + i;
    try {
      const sessionId = route.params.id
      const policyToken = await getUploadPolicyToken(newFiles[i].file.name, NAMESPACE.UPLOAD, sessionId)
      
      const response = await uploadToOSS(newFiles[i].file, policyToken)
      if (response.ok) {
        uploadedFiles.value[index].uploading = false;
      } else {
        throw new Error('Error uploading file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      uploadedFiles.value[index].uploading = false;
      uploadedFiles.value[index].error = true;
    }
  }
}

const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1)
}

onMounted(() => {
  if (textareaRef.value) {
    textareaRef.value.focus()
  }
})
</script>

<style scoped>
.chat-input-container {
  background: var(--white);
  position: relative;
  padding: 16px 0;
  max-width: 100%;
  box-sizing: border-box;
}

.input-area {
  max-width: 850px;
  margin: 0 auto;
  padding: 0 16px;
  position: relative;
}

.input-pill {
  background: var(--white);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-pill:focus-within {
  border-color: #909090;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04);
}

.input-content {
  display: flex;
  align-items: center;
  min-height: 30px;
  position: relative;
  flex: 1;
}

.message-input {
  width: 100%;
  padding: 4px 0;
  margin: 0;
  border: none;
  background: transparent;
  font-size: 15px;
  line-height: 1.5;
  resize: none;
  outline: none;
  color: var(--text-primary);
  min-height: 40px;
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

.message-input::placeholder {
  color: var(--text-tertiary);
  opacity: 0.6;
}

.input-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0 0;
  margin-top: 8px;
  min-height: 40px;
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.right-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tooltip-container {
  position: relative;
  display: inline-block;
}

.btn-config {
  position: relative;
  background: none;
  border: none;
  color: var(--color-text);
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--color-hover-bg);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.btn-config:hover {
  background: rgba(0, 0, 0, 0.04);
}

.tooltip {
  visibility: hidden;
  width: auto;
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

.btn-send {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary-color);
  color: white;
}

.btn-send:disabled {
  background: var(--primary-color);
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-stop {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #f44336;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-stop:hover {
  background-color: #d32f2f;
}

.btn-stop:disabled {
  background-color: #e0e0e0;
  color: #9e9e9e;
  cursor: not-allowed;
}

.btn-config:hover .tooltip,
.btn-send:hover .tooltip,
.btn-stop:hover .tooltip {
  visibility: visible;
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.btn-config:focus,
.btn-send:focus,
.btn-stop:focus {
  outline: none;
  box-shadow: none;
}

@media (max-width: 768px) {
  .input-area {
    padding: 0 16px 12px;
  }

  .input-content {
    padding: 10px 12px 6px;
  }

  .input-controls {
    padding: 6px 8px;
  }

  .btn-send,
  .btn-config {
    width: 28px;
    height: 28px;
  }

  .message-input {
    font-size: 14px;
  }
}
</style>