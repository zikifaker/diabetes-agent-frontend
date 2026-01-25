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
        <span class="message-time">{{ formatLocalDateTime(message.createdAt) }}</span>
      </div>

      <div v-if="message.role === 'human' && message.uploadedFiles?.length > 0" class="uploaded-files-grid">
        <div v-for="(fileName, index) in message.uploadedFiles" :key="index" class="file-card-modern"
          :class="getFileCategory(fileName)" @click="handleFileClick(fileName)">
          <div class="file-icon-wrapper">
            <component :is="getFileIcon(fileName)" class="type-icon" />
          </div>
          <div class="file-details">
            <span class="file-name-text">{{ fileName }}</span>
          </div>
        </div>
      </div>

      <div v-if="message.role === 'ai'" class="parsing-animation">
        <Transition name="status-fade">
          <div v-if="message.parsingUploadedFiles" class="status-capsule">
            <ParsingFilesIcon class="icon" />
            <span class="status-text">正在解析文件</span>
            <div class="loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        </Transition>

        <Transition name="status-fade">
          <div v-if="message.retrievingKnowledgeBase" class="status-capsule search">
            <SearchPulseIcon class="icon" />
            <span class="status-text">正在检索知识库</span>
            <div class="loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        </Transition>
      </div>

      <div v-if="message.role === 'ai' && message.intermediateSteps" class="thinking-steps">
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
          <ThinkingToggleIcon :expanded="showThinking" />
        </div>
        <transition name="slide-fade">
          <div v-if="showThinking" class="thinking-content">
            <div class="thinking-text">{{ message.intermediateSteps }}</div>
          </div>
        </transition>
      </div>

      <div v-if="message.role === 'ai' && message.toolCallResults && message.toolCallResults.length > 0"
        class="tool-call-trigger">
        <button @click="showToolCalls" class="btn-tool-call">
          <ToolCallResultIcon />
          <span>查看工具调用结果</span>
        </button>
      </div>

      <div v-if="message.content" class="message-content-wrapper">
        <div class="message-text markdown-body" v-html="renderMarkdown(message.content)"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { marked } from 'marked'
import {
  AIAvatarIcon, ThinkingCheckmarkIcon, ThinkingToggleIcon, 
  ToolCallResultIcon, ParsingFilesIcon, SearchPulseIcon
} from '@/icons/chat/message'
import { ImageIcon, DefaultFileIcon } from '@/icons/chat/input'
import { getFileDownloadLink, NAMESPACE } from '@/utils/oss'
import { formatLocalDateTime } from '@/utils/time'

const props = defineProps({
  message: Object,
  streaming: Boolean
})

const route = useRoute()
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
  return props.streaming && !props.message.thinkingComplete
})

const handleFileClick = async (fileName) => {
  try {
    const sessionId = route.params.id
    const downloadLink = await getFileDownloadLink(fileName, NAMESPACE.UPLOAD, sessionId)
    window.open(downloadLink, '_blank')
  } catch (error) {
    console.error('Failed to handle file click:', error)
  }
}

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
  return extension.match(/(jpg|jpeg|png|gif|webp)$/) ? ImageIcon : DefaultFileIcon
}

function getThinkingStatus() {
  if (props.streaming && !props.message.thinkingComplete) {
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
  emit('show-tool-calls', props.message.toolCallResults)
}
</script>

<style scoped>
.message-wrapper {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  width: 100%;
}

.message-wrapper.ai {
  flex-direction: row;
}

.message-wrapper.human {
  flex-direction: row-reverse;
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
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-content {
  flex: 1;
  max-width: 80%;
  display: flex;
  flex-direction: column;
}

.human .message-content {
  align-items: flex-end;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
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

.human .message-text {
  background-color: var(--primary-color, #007bff);
  color: white;
  padding: 12px 16px;
  border-radius: 16px 8px 16px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  line-height: 1.6;
  width: fit-content;
  text-align: left;
}

.human .message-text :deep(*) {
  color: white !important;
}

.ai .message-text {
  background-color: transparent;
  padding: 4px 0;
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

.thinking-steps {
  margin: 16px 0;
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
  width: 8px;
  height: 8px;
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
  padding: 8px;
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

.message-content-wrapper {
  position: relative;
  padding: 8px 0;
}

.human .message-content-wrapper {
  display: flex;
  justify-content: flex-end;
  width: 100%;
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

.slide-fade-enter-active {
  transition: all 0.6s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-5px);
  opacity: 0;
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

.uploaded-files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin: 12px 0;
  width: auto;
  max-width: 100%;
}

.human .uploaded-files-grid {
  margin-left: auto;
  justify-content: flex-end;
  width: fit-content;
}

.file-card-modern {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.file-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name-text {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.cat-image .file-icon-wrapper {
  background: #e0f2fe;
  color: #0ea5e9;
}

.cat-pdf .file-icon-wrapper {
  background: #fee2e2;
  color: #ef4444;
}

.cat-excel .file-icon-wrapper {
  background: #dcfce7;
  color: #22c55e;
}

.cat-word .file-icon-wrapper {
  background: #ede9fe;
  color: #8b5cf6;
}

.cat-default .file-icon-wrapper {
  background: #f1f5f9;
  color: #64748b;
}

.human .file-card-modern {
  background: rgba(255, 255, 255, 0.9);
  border: none;
}

.parsing-animation {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0;
}

.status-capsule {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 4px 12px;
  background-color: var(--bg-secondary);
  border-radius: 100px;
  gap: 8px;
  transition: all 0.3s ease;
}

.status-text {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.icon {
  color: var(--primary-color);
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-dots {
  display: flex;
  color: var(--primary-color);
  font-weight: bold;
}

.loading-dots span {
  animation: opacity-dots 1.4s infinite;
  opacity: 0;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes opacity-dots {

  0%,
  100% {
    opacity: 0;
  }

  50% {
    opacity: 1;
  }
}

.status-fade-enter-active,
.status-fade-leave-active {
  transition: all 0.3s ease;
}

.status-fade-enter-from,
.status-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
