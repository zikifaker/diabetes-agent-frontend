<template>
  <div class="chat-input-container">
    <AgentConfigModal v-model:show="showConfig" v-model:config="agentConfig" :tools-options="toolsOptions"
      @close="showConfig = false" />

    <div class="input-area">
      <div class="input-pill">
        <div class="input-content">
          <textarea ref="textareaRef" v-model="message" @keydown.enter.exact.prevent="handleSend"
            @keydown.shift.enter.stop @input="autoResize" :placeholder="placeholder" rows="1" class="message-input"
            :disabled="loading" :aria-label="placeholder"></textarea>
        </div>

        <div class="input-controls">
          <div class="left-controls">
            <LLMSelector v-model:modelValue="selectedLLM" :llm-options="llmOptions" class="llm-selector" />

            <button @click="showConfig = true" class="btn-config" title="配置" aria-label="智能体配置">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                  stroke="currentColor" stroke-width="1.5" />
                <path
                  d="M19.6224 10.3954L18.5247 7.7448L20 6L18 4L16.2647 5.48295L13.5578 4.36974L12.9353 2H10.981L10.3491 4.40113L7.70441 5.51596L6 4L4 6L5.45337 7.78885L4.3725 10.4463L2 11V13L4.40111 13.6555L5.51575 16.2997L4 18L6 20L7.79116 18.5403L10.397 19.6123L11 22H13L13.6045 19.6132L16.2551 18.5155C16.6969 18.8313 18 20 18 20L20 18L18.5159 16.2494L19.6139 13.598L21.9999 12.9772L22 11L19.6224 10.3954Z"
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <div class="right-controls">
            <VoiceInputButton v-model:isListening="isListening" @result="handleVoiceResult" class="voice-input-btn" />

            <button @click="handleSend" class="btn-send" :disabled="loading || !message.trim()"
              :title="message.trim() ? '发送消息' : '请输入消息内容'" :aria-label="message.trim() ? '发送消息' : '请输入消息内容'">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import AgentConfigModal from './components/AgentConfigModal.vue'
import LLMSelector from './components/LLMSelector.vue'
import VoiceInputButton from './components/VoiceInputButton.vue'

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

const emit = defineEmits(['send'])

const message = ref('')
const showConfig = ref(false)
const textareaRef = ref(null)
const isListening = ref(false)

const llmOptions = ref([
  {
    id: 'qwen3-max',
    name: '通义千问3-max',
    description: '适配复杂场景，达到领域 SOTA 水平'
  },
  {
    id: 'deepseek-v3.2',
    name: 'DeepSeek-V3.2',
    description: 'DeepSeek最新模型'
  }
])

const selectedLLM = ref(llmOptions.value[0])

const toolsOptions = ref([
  {
    label: '糖尿病知识图谱',
    value: 'diabetes_knowledge_graph',
  },
  {
    label: '个人知识库',
    value: 'user_knowledge_base',
  },
  {
    label: '天气查询',
    value: 'weather_search',
  },
  {
    label: '计算器',
    value: 'calculator',
  }
])

const agentConfig = ref({
  maxIterations: 5,
  tools: ['diabetes_knowledge_graph', 'user_knowledge_base']
})

function handleSend() {
  if (!message.value.trim() || props.loading) return

  emit('send', {
    message: message.value,
    agentConfig: {
      ...agentConfig.value,
      model: selectedLLM.value.id
    }
  })

  message.value = ''
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
      textareaRef.value.style.minHeight = '24px'
    }
  })
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
  position: relative;
  z-index: 10;
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

.llm-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.message-input {
  width: 100%;
  padding: 0;
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
  padding: 4px 0;
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

.btn-voice,
.btn-send,
.btn-config {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  color: var(--text-secondary);
}

.btn-send {
  background: var(--primary-color);
  color: white;
}

.btn-send:disabled {
  background: var(--border-color);
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-voice:hover,
.btn-config:hover {
  background: rgba(0, 0, 0, 0.04);
}

.btn-llm:focus,
.btn-config:focus,
.btn-voice:focus,
.btn-send:focus {
  outline: none;
  box-shadow: none;
}

.btn-voice {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.btn-voice:hover {
  background: rgba(0, 0, 0, 0.04);
}

.btn-voice.listening {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.pulse-animation {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.2);
  animation: pulse 1.5s infinite;
  z-index: 1;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }

  70% {
    transform: scale(1.3);
    opacity: 0;
  }

  100% {
    transform: scale(0.8);
    opacity: 0;
  }
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

  .llm-dropdown {
    width: 240px;
  }

  .btn-llm {
    padding: 2px 8px;
    font-size: 12px;
    height: 28px;
  }

  .btn-voice,
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
