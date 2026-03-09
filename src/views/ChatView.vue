<template>
  <div class="chat-container">
    <MenuSidebar :sidebar-visible="sidebarVisible" @new-chat="handleNewChat" />

    <main class="main-content" :class="{ 'sidebar-hidden': !sidebarVisible }">
      <div class="chat-wrapper">
        <div class="chat-area">
          <div class="chat-header">
            <button @click="toggleSidebar" class="btn-icon">
              <MenuSidebarToggleIcon :rotated="!sidebarVisible" />
            </button>
            <LLMSelector v-model:modelValue="selectedLLM" :llm-options="llmOptions" class="llm-selector" />
          </div>

          <div class="messages-scroll" ref="messagesContainer" @scroll="handleScroll">
            <div class="messages-container">
              <MessageBubble v-for="(message, idx) in sessionStore.messages" :key="message.createdAt" :message="message"
                :data-message-idx="idx" @show-tool-calls="showToolCallSidebar" />

              <MessageBubble v-if="streamingMessage" :message="streamingMessage" :streaming="isLoading"
                @show-tool-calls="showToolCallSidebar" />
            </div>
          </div>

          <ChatInput @send="onSend" @stop="chatStore.handleStop" :loading="isLoading" :model="selectedLLM.id" />
        </div>

        <div class="message-navigator" v-if="userMessages.length > 0">
          <div class="nav-dots-container">
            <div v-for="msg in userMessages" :key="msg.idx" class="nav-dot"
              :class="{ 'active': activeUserMessageIdx === msg.idx }" :style="{ top: msg.top + '%' }"
              @click="scrollToMessage(msg.idx)" @mouseenter="hoveredUserMessage = msg"
              @mouseleave="hoveredUserMessage = null">
              <div v-if="hoveredUserMessage?.idx === msg.idx" class="nav-tooltip">
                {{ msg.preview }}
              </div>
            </div>
          </div>
        </div>

        <ToolCallSidebar :visible="isToolCallSidebarVisible" :results="currentToolCallResults"
          @close="closeToolCallSidebar" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/session'
import { useChat } from '@/stores/chat'
import { MenuSidebar, ToolCallSidebar } from '@/components/sidebar'
import { ChatInput } from '@/components/chat/input'
import { LLMSelector } from '@/components/chat/header'
import { MessageBubble } from '@/components/chat/message'
import { MenuSidebarToggleIcon } from '@/assets/icons/navigation'
import { LLM_OPTIONS } from '@/constants/chat'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const chatStore = useChat()

const {
  isLoading,
  streamingMessage,
  autoScrollEnabled,
  messagesContainer,
  initialMessage
} = storeToRefs(chatStore)

const sidebarVisible = ref(true)

const isToolCallSidebarVisible = ref(false)
const currentToolCallResults = ref([])

const llmOptions = LLM_OPTIONS
const selectedLLM = ref(llmOptions[0])

const hoveredUserMessage = ref(null)
const activeUserMessageIdx = ref(-1)

const userMessages = computed(() => {
  const messages = sessionStore.messages
  const result = []

  let totalAILength = 0
  for (let i = 1; i < messages.length; i += 2) {
    totalAILength += messages[i].content.length
  }

  const safeTotalLength = totalAILength || 1
  let currentAccumulatedLength = 0

  for (let i = 0; i < messages.length; i += 2) {
    const userMsg = messages[i]
    const aiMsg = messages[i + 1]

    // 计算当前 dot 高度占总长度的百分比
    const topPercent = (currentAccumulatedLength / safeTotalLength) * 100

    result.push({
      idx: i,
      preview: userMsg.content.slice(0, 50) + (userMsg.content.length > 50 ? '...' : ''),
      top: topPercent
    })

    if (aiMsg) {
      currentAccumulatedLength += aiMsg.content.length
    }
  }
  return result;
});

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
}

async function handleNewChat() {
  router.push(`/`)
}

async function onSend(data) {
  try {
    await chatStore.handleSend(data, route.params.id)
  } catch (error) {
    console.error('Error sending message:', error)
  }
}

function handleScroll() {
  const el = messagesContainer.value
  if (!el) return

  // 用户距离容器底部超过 100px 时禁止自动滚动
  autoScrollEnabled.value = isNearBottom(el, 100)
}

function isNearBottom(el, threshold) {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
}

function showToolCallSidebar(results) {
  // 若工具侧边栏处于打开状态，先关闭再切换到其他结果集，避免产生抖动
  if (isToolCallSidebarVisible.value) {
    currentToolCallResults.value = null
    isToolCallSidebarVisible.value = false
    return
  }
  currentToolCallResults.value = results
  isToolCallSidebarVisible.value = true
}

function closeToolCallSidebar() {
  isToolCallSidebarVisible.value = false
}

function scrollToMessage(idx) {
  const el = messagesContainer.value?.querySelector(`[data-message-idx="${idx}"]`)
  if (el) {
    el.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
    activeUserMessageIdx.value = idx
  }
}

onMounted(async () => {
  const sessionId = route.params.id
  if (!sessionId) return

  if (initialMessage.value) {
    // 若从首页跳转，发送消息
    const data = initialMessage.value
    initialMessage.value = null

    const session = sessionStore.sessions.find(s => s.id == sessionId)
    if (session) {
      sessionStore.setCurrentSession(session)
    }

    await chatStore.handleSend(data, sessionId)
  } else {
    // 若从已有的聊天会话进入，获取历史消息
    try {
      await sessionStore.fetchMessages(sessionId)
    } catch (error) {
      console.error('Error fetching session messages:', error)
    }

    const session = sessionStore.sessions.find(s => s.id == sessionId)
    if (session) {
      sessionStore.setCurrentSession(session)
    }
  }
})

onMounted(() => {
  const handleBeforeUnload = (e) => {
    // 当内容正在生成中时，阻止默认的页面卸载行为
    if (isLoading.value) {
      e.preventDefault()
      e.returnValue = ''
      return e.returnValue
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })
})

watch(() => route.params.id, async (newId) => {
  try {
    // 若无内容正在生成且不是从首页跳转，获取历史消息
    if (newId && !isLoading.value && !initialMessage.value) {
      await sessionStore.fetchMessages(newId)

      const session = sessionStore.sessions.find(s => s.id == newId)
      if (session) {
        sessionStore.setCurrentSession(session)
      }
    }
  } catch (error) {
    console.error('Error fetching session messages:', error)
  }
})
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease-in-out;
  background: var(--white);
  overflow: hidden;
}

.chat-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
  padding-bottom: 24px;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease-in-out;
  min-width: 0;
}

.main-content.sidebar-hidden {
  margin-left: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: var(--white);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: var(--text-secondary);
  transition: var(--transition);
}

.btn-icon:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.messages-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 24px 0;
  scrollbar-gutter: stable;
}

.messages-scroll::-webkit-scrollbar {
  display: none;
}

.messages-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 24px;
}

.messages-container::-webkit-scrollbar {
  display: none;
}

.message-navigator {
  width: 40px;
  height: calc(100vh - 120px);
  position: sticky;
  top: 60px;
  margin-right: 8px;
}

.nav-dots-container {
  position: relative;
  width: 18px;
  height: 100%;
  background-color: var(--hover-bg);
  border-radius: 12px;
  margin: 0 auto;
}

.nav-dot {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.8);
  border: 2px solid var(--white);
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.nav-dot:hover,
.nav-dot.active {
  background: #548fce;
  transform: translate(-50%, -50%) scale(1.3);
}

.nav-tooltip {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: white;
  color: black;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 10px;
  white-space: nowrap;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  z-index: 1000;
}
</style>
