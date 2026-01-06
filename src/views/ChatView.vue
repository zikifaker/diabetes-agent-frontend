<template>
  <div class="chat-container">
    <MenuSidebar :sidebar-visible="sidebarVisible" @toggle-sidebar="toggleSidebar" @new-chat="handleNewChat" />

    <main class="main-content" :class="{ 'sidebar-hidden': !sidebarVisible }">
      <div class="chat-wrapper">
        <div class="chat-area">
          <div class="chat-header">
            <button @click="toggleSidebar" class="btn-icon">
              <SidebarToggleIcon :rotated="!sidebarVisible" />
            </button>
            <h4>{{ sessionStore.currentSession?.title || '新会话' }}</h4>
          </div>

          <div class="messages-scroll" ref="messagesContainer" @scroll="handleScroll">
            <div class="messages-container">
              <div v-if="sessionStore.messages.length === 0" class="empty-messages">
                <p>开始体验 Diabetes Agent</p>
              </div>

              <MessageBubble v-for="message in sessionStore.messages" :key="message.id" :message="message"
                @show-tool-calls="showToolCallSidebar" />

              <MessageBubble v-if="streamingMessage" :message="streamingMessage" :streaming="true"
                @show-tool-calls="showToolCallSidebar" />
            </div>
          </div>

          <ChatInput @send="handleSend" @stop="handleStop" :loading="isLoading" />
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
import { useSessionStore } from '@/stores/session'
import MenuSidebar from '@/components/layout/MenuSidebar.vue'
import MessageBubble from '@/components/chat/message/MessageBubble.vue'
import ToolCallSidebar from '@/components/layout/ToolCallSidebar.vue'
import ChatInput from '@/components/chat/input/ChatInput.vue'
import { SidebarToggleIcon } from '@/components/icons'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()

const sidebarVisible = ref(true)
const isLoading = ref(false)
const streamingMessage = ref(null)
const messagesContainer = ref(null)
const autoScrollEnabled = ref(true)
const abortController = ref(null)
const isToolCallSidebarVisible = ref(false)
const currentToolCallResults = ref([])

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
}

async function handleNewChat() {
  await sessionStore.createSession()
}

async function handleSend(data) {
  const sessionId = route.params.id
  if (!sessionId) {
    const session = await sessionStore.createSession()
    router.push(`/chat/${session.id}`)
    return
  }

  abortController.value = new AbortController()
  isLoading.value = true

  const userMessage = {
    id: Date.now(),
    created_at: new Date().toISOString(),
    role: 'human',
    content: data.message,
    uploaded_files: data.uploaded_files
  }
  sessionStore.addMessage(userMessage)

  streamingMessage.value = {
    id: Date.now() + 1,
    created_at: new Date().toISOString(),
    role: 'ai',
    thinking_complete: false,
    immediate_steps: '',
    tool_call_results: [],
    content: ''
  }

  const token = localStorage.getItem('token')

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }

    const body = JSON.stringify({
      session_id: sessionId,
      query: data.message,
      agent_config: {
        model: data.agentConfig.model,
        max_iterations: data.agentConfig.maxIterations,
        tools: data.agentConfig.tools
      },
      uploaded_files: data.uploaded_files
    })

    const response = await fetch('http://localhost:8088/api/chat', {
      method: 'POST',
      headers,
      body,
      signal: abortController.value.signal
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      while (true) {
        const newlineIndex = buffer.indexOf('\n\n')
        if (newlineIndex === -1) break

        const message = buffer.slice(0, newlineIndex)
        buffer = buffer.slice(newlineIndex + 2)

        const lines = message.split('\n');
        let eventType = ''
        let eventData = []

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            eventData.push(line.slice(5))
          }
        }

        const combinedData = eventData.join('\n')
        if (combinedData || eventType === 'done') {
          handleStreamEvent({
            type: eventType,
            content: combinedData,
          })
        }
      }

      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Request was cancelled by user')

      if (streamingMessage.value) {
        streamingMessage.value.content += '\n\n[生成已停止]'
        sessionStore.addMessage(streamingMessage.value)
        streamingMessage.value = null
      }
    } else {
      console.error('Error processing chat stream response:', error)
    }
  } finally {
    isLoading.value = false
    abortController.value = null
  }
}

function handleStreamEvent(event) {
  if (!streamingMessage.value) return

  switch (event.type) {
    case 'immediate_steps':
      streamingMessage.value.immediate_steps += event.content
      break

    case 'tool_call_results':
      try {
        const result = JSON.parse(event.content)
        streamingMessage.value.tool_call_results.push(result)
      } catch (e) {
        console.error('Failed to parse tool_call_result:', event.content, e)
      }
      break

    case 'final_answer':
      if (!streamingMessage.value.thinking_complete && streamingMessage.value.immediate_steps) {
        streamingMessage.value.thinking_complete = true
      }
      streamingMessage.value.content += event.content
      break

    case 'done':
      if (!streamingMessage.value.thinking_complete && streamingMessage.value.immediate_steps) {
        streamingMessage.value.thinking_complete = true
      }
      sessionStore.addMessage(streamingMessage.value)
      streamingMessage.value = null
      break

    case 'error':
      sessionStore.addMessage({
        id: Date.now() + 1,
        created_at: new Date().toISOString(),
        role: 'ai',
        content: "系统错误，请稍后重试",
      })
      console.error('Stream error:', event.content)
      streamingMessage.value = null
      break
  }
}

function scrollToBottom() {
  if (!autoScrollEnabled.value) return

  const el = messagesContainer.value
  if (!el) return

  el.scrollTop = el.scrollHeight
}

function handleScroll() {
  const el = messagesContainer.value
  if (!el) return

  // 用户不在底部时禁止自动滚动
  autoScrollEnabled.value = isNearBottom(el)
}

function isNearBottom(el, threshold = 20) {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
}

function handleStop() {
  if (abortController.value) {
    abortController.value.abort()
  }
}

function showToolCallSidebar(results) {
  currentToolCallResults.value = results
  isToolCallSidebarVisible.value = true
}

function closeToolCallSidebar() {
  isToolCallSidebarVisible.value = false
}

onMounted(async () => {
  try {
    const sessionId = route.params.id
    if (sessionId) {
      await sessionStore.fetchMessages(sessionId)
      const session = sessionStore.sessions.find(s => s.id == sessionId)
      if (session) {
        sessionStore.setCurrentSession(session)
      }
      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    console.error('Error fetching session messages:', error)
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
    if (newId) {
      await sessionStore.fetchMessages(newId)
      const session = sessionStore.sessions.find(s => s.id == newId)
      if (session) {
        sessionStore.setCurrentSession(session)
      }
      await nextTick()
      scrollToBottom()
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

.empty-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
  font-size: 16px;
}
</style>
