<template>
  <div class="message-wrapper" :class="message.role">
    <div class="message-avatar">
      <img v-if="message.role === 'human'" :src="userAvatar" alt="用户" />
      <div v-else class="assistant-avatar">
        <AIAvatarIcon />
      </div>
    </div>

    <div class="message-content">
      <div class="message-header">
        <span class="message-sender">{{ message.role === 'human' ? '用户' : 'AI Agent' }}</span>
        <span class="message-time">{{ formatTime(message.created_at) }}</span>
      </div>

      <!--TODO:  用户上传的文件，点击即下载文件-->
      <div v-if="message.role === 'ai' && message.immediate_steps" class="thinking-steps">
        <div class="thinking-header" @click="toggleThinking">
          <div class="thinking-title">
            <div class="thinking-icon">
              <template v-if="isThinking">
                <span class="dot thinking"></span>
                <span class="dot thinking"></span>
                <span class="dot thinking"></span>
              </template>
              <template v-else>
                <ThinkingCheckmarkIcon />
              </template>
            </div>
            <span class="thinking-status">
              {{ getThinkingStatus() }}
            </span>
          </div>
          <ThinkingToggleIcon />
        </div>
        <transition name="slide-fade">
          <div v-if="showThinking" class="thinking-content">
            <div class="thinking-text">{{ message.immediate_steps }}</div>
          </div>
        </transition>
      </div>

      <div v-if="message.role === 'ai' && message.tool_call_results && message.tool_call_results.length > 0"
        class="tool-call-trigger">
        <button @click="showToolCalls" class="btn-tool-call">
          <ToolCallResultIcon />
          <span>查看工具调用结果</span>
        </button>
      </div>

      <transition name="fade-in">
        <div v-if="message.content" class="message-content-wrapper">
          <div class="message-text markdown-body" v-html="renderMarkdown(message.content)"></div>
        </div>
      </transition>

      <div v-if="streaming && !message.content && message.immediate_steps" class="typing-wrapper">
        <div class="typing-indicator">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { marked } from 'marked'
import { AIAvatarIcon, ThinkingCheckmarkIcon, ThinkingToggleIcon, ToolCallResultIcon } from '@/components/icons'

const props = defineProps({
  message: Object,
  streaming: Boolean
})

const authStore = useAuthStore()
const showThinking = ref(true)

const emit = defineEmits(['show-tool-calls'])

marked.setOptions({
  gfm: true,
  breaks: true,
  xhtml: true,
  smartLists: true,
  smartypants: true,
})

const userAvatar = computed(() => authStore.user?.avatar || '')

const isThinking = computed(() => {
  return props.streaming && !props.message.thinking_complete;
});

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function getThinkingStatus() {
  if (props.streaming && !props.message.thinking_complete) {
    return '思考中'
  }
  return '思考完毕'
}

function toggleThinking() {
  showThinking.value = !showThinking.value
}

function renderMarkdown(content) {
  return marked(content)
}

function showToolCalls() {
  emit('show-tool-calls', props.message.tool_call_results)
}
</script>

<style scoped>
.message-wrapper {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.message-avatar {
  flex-shrink: 0;
}

.message-avatar img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.assistant-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.message-content {
  flex: 1;
  min-width: 800px;
  max-width: 1000px;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.message-sender {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.message-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.message-text {
  font-size: 15px;
  color: var(--text-primary);
  white-space: normal;
  word-break: break-word;
  line-height: 2.5;
}

.markdown-body>* {
  margin-top: 0.55em;
  margin-bottom: 0.55em;
}

.markdown-body>*:first-child {
  margin-top: 0;
}

.markdown-body>*:last-child {
  margin-bottom: 0;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 0.95em;
  margin-bottom: 0.4em;
}

.markdown-body h1+p,
.markdown-body h2+p,
.markdown-body h3+p {
  margin-top: 0.3em;
}

.markdown-body ul,
.markdown-body ol {
  margin-top: 0.45em;
  margin-bottom: 0.45em;
}

.markdown-body li {
  margin: 0.25em 0;
}

.markdown-body li>p {
  margin: 0.25em 0;
}

.typing-indicator {
  display: inline-block;
  animation: blink 1s infinite;
  color: var(--primary-color);
  font-weight: bold;
}

.thinking-steps {
  margin-bottom: 16px;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.thinking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background-color: var(--bg-secondary);
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  border-bottom: 1px solid transparent;
}

.thinking-header:hover {
  background-color: var(--bg-tertiary);
}

.thinking-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.thinking-icon {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 18px;
}

.thinking-icon .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--primary-color);
  opacity: 0.6;
}

.thinking-icon .dot.thinking {
  animation: bounce 1.4s infinite ease-in-out both;
}

.thinking-icon .dot.thinking:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-icon .dot.thinking:nth-child(2) {
  animation-delay: -0.16s;
}

.thinking-content {
  padding: 0 16px 16px;
  background-color: var(--bg-primary);
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 14px;
  border-top: 1px solid var(--border-color);
}

.thinking-text {
  padding: 12px;
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  white-space: pre-wrap;
  word-wrap: break-word;
  position: relative;
  overflow: hidden;
}

.thinking-text::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
      transparent,
      rgba(var(--primary-color-rgb), 0.3),
      transparent);
  animation: shine 3s infinite;
}

.typing-wrapper {
  padding: 8px 0;
}

.typing-indicator {
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  width: fit-content;
}

.typing-indicator .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--primary-color);
  opacity: 0.6;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator .dot:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator .dot:nth-child(2) {
  animation-delay: -0.16s;
}

.message-content-wrapper {
  position: relative;
  padding: 8px 0;
  animation: fadeIn 0.3s ease-out;
}

@keyframes bounce {

  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }

  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

@keyframes shine {
  0% {
    transform: translateX(-100%);
  }

  20% {
    transform: translateX(100%);
  }

  100% {
    transform: translateX(100%);
  }
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

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-5px);
  opacity: 0;
}

.fade-in-enter-active {
  animation: fadeIn 0.4s ease-out;
}

.tool-call-trigger {
  margin-bottom: 12px;
}

.btn-tool-call {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-tool-call:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--primary-color);
}

.btn-tool-call svg {
  transition: color 0.2s ease;
}

.btn-tool-call:hover svg {
  color: var(--primary-color);
}
</style>
