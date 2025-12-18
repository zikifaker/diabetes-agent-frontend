<template>
  <div class="chat-container">
    <Sidebar :sidebar-visible="sidebarVisible" @toggle-sidebar="toggleSidebar" @new-chat="handleNewChat" />

    <main class="main-content" :class="{ 'sidebar-hidden': !sidebarVisible }">
      <div class="chat-header">
        <button @click="toggleSidebar" class="btn-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" :class="{ 'rotate-180': !sidebarVisible }">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </button>
        <h4>{{ sessionStore.currentSession?.title || '新会话' }}</h4>
      </div>

      <div class="messages-scroll" ref="messagesContainer" @scroll="handleScroll">
        <div class="messages-container">
          <div v-if="sessionStore.messages.length === 0" class="empty-messages">
            <p>开始体验 Diabetes Agent</p>
          </div>

          <MessageBubble v-for="message in sessionStore.messages" :key="message.id" :message="message" />

          <MessageBubble v-if="streamingMessage" :message="streamingMessage" :streaming="true" />
        </div>
      </div>

      <ChatInput @send="handleSend" :loading="isLoading" />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import Sidebar from '@/components/Sidebar.vue'
import MessageBubble from '@/components/MessageBubble.vue'
import ChatInput from '@/components/chat-input/ChatInput.vue'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()

const sidebarVisible = ref(true)
const isLoading = ref(false)
const streamingMessage = ref(null)
const messagesContainer = ref(null)
const autoScrollEnabled = ref(true)

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
}

async function handleNewChat() {
  const session = await sessionStore.createSession()
  router.push(`/chat/${session.id}`)
}

async function handleSend(data) {
  const sessionId = route.params.id
  if (!sessionId) {
    const session = await sessionStore.createSession()
    router.push(`/chat/${session.id}`)
    return
  }

  isLoading.value = true

  const userMessage = {
    id: Date.now(),
    created_at: new Date().toISOString(),
    role: 'human',
    content: data.message,
  }
  sessionStore.addMessage(userMessage)

  streamingMessage.value = {
    id: Date.now() + 1,
    created_at: new Date().toISOString(),
    role: 'ai',
    immediate_steps: '',
    content: '',
    thinking_complete: false,
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
      }
    })

    const response = await fetch('http://localhost:8088/api/chat', {
      method: 'POST',
      headers,
      body
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
    console.error('Error processing chat stream response:', error)
  } finally {
    isLoading.value = false
  }
}

function handleStreamEvent(event) {
  if (!streamingMessage.value) return

  switch (event.type) {
    case 'immediate_steps':
      streamingMessage.value.immediate_steps += event.content
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
      const errorMessage = event.content
      sessionStore.addMessage({
        id: Date.now() + 1,
        created_at: new Date().toISOString(),
        role: 'ai',
        content: errorMessage,
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
  transition: var(--transition);
  background: var(--white);
}

.main-content.sidebar-hidden {
  margin-left: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
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
  scrollbar-width: thin;
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

.rotate-180 {
  transform: rotate(180deg);
}
</style>
