<template>
  <div class="chat-container">
    <MenuSidebar :sidebar-visible="sidebarVisible" @toggle-sidebar="toggleSidebar" @new-chat="handleNewChat" />

    <main class="main-content" :class="{ 'sidebar-hidden': !sidebarVisible }">
      <div class="chat-wrapper">
        <div class="chat-area">
          <div class="chat-header">
            <button @click="toggleSidebar" class="btn-icon">
              <MenuSidebarToggleIcon :rotated="!sidebarVisible" />
            </button>
            <h4>{{ sessionStore.currentSession?.title || '新会话' }}</h4>
          </div>

          <div class="messages-scroll" ref="messagesContainer" @scroll="handleScroll">
            <div class="messages-container">
              <MessageBubble v-for="message in sessionStore.messages" :key="message.id" :message="message"
                @show-tool-calls="showToolCallSidebar" />

              <MessageBubble v-if="streamingMessage" :message="streamingMessage" :streaming="true"
                @show-tool-calls="showToolCallSidebar" />
            </div>
          </div>

          <ChatInput @send="onSend" @stop="chatStore.handleStop" :loading="isLoading" />
        </div>
        <ToolCallSidebar :visible="isToolCallSidebarVisible" :results="currentToolCallResults"
          @close="closeToolCallSidebar" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/session'
import { useChat } from '@/stores/chat'
import MenuSidebar from '@/components/layout/MenuSidebar.vue'
import MessageBubble from '@/components/chat/message/MessageBubble.vue'
import ToolCallSidebar from '@/components/layout/ToolCallSidebar.vue'
import ChatInput from '@/components/chat/input/ChatInput.vue'
import { MenuSidebarToggleIcon } from '@/components/icons'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const chatStore = useChat()

const {
  isLoading,
  streamingMessage,
  autoScrollEnabled,
  messagesContainer,
  messageFromHome
} = storeToRefs(chatStore)

const sidebarVisible = ref(true)
const isToolCallSidebarVisible = ref(false)
const currentToolCallResults = ref([])

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

  // 用户距离容器底部超过 20px 时禁止自动滚动
  autoScrollEnabled.value = isNearBottom(el, 20)
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

onMounted(async () => {
  const sessionId = route.params.id
  if (!sessionId) return

  // 若从 HomeView 进入当前页面，发送消息
  if (messageFromHome.value) {
    const data = messageFromHome.value
    messageFromHome.value = null

    const session = sessionStore.sessions.find(s => s.id == sessionId)
    if (session) {
      sessionStore.setCurrentSession(session)
    }

    await chatStore.handleSend(data, sessionId)
    return
  }

  await sessionStore.fetchMessages(sessionId)
  const session = sessionStore.sessions.find(s => s.id == sessionId)
  if (session) {
    sessionStore.setCurrentSession(session)
  }

  await nextTick()
  chatStore.scrollToBottom()
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
    // 若当前不在发送消息且不是从首页跳转的新会话，获取历史消息
    if (newId && !isLoading.value && !messageFromHome.value) {
      await sessionStore.fetchMessages(newId)
      const session = sessionStore.sessions.find(s => s.id == newId)
      if (session) {
        sessionStore.setCurrentSession(session)
      }

      await nextTick()
      chatStore.scrollToBottom()
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

.chat-header h2 {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
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
  scrollbar-color: rgba(84, 143, 206, 0.25) transparent;
  scrollbar-gutter: stable;
}

.messages-scroll::-webkit-scrollbar {
  width: 8px;
}

.messages-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.messages-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 24px;
}

.messages-container::-webkit-scrollbar {
  display: none;
}
</style>
