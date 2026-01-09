import { ref, nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useSessionStore } from '@/stores/session'

export const useChat = defineStore('chat', () => {
  const sessionStore = useSessionStore()

  const isLoading = ref(false)
  const streamingMessage = ref(null)
  const abortController = ref(null)
  const autoScrollEnabled = ref(true)
  const messagesContainer = ref(null)

  // 从首页跳转到聊天页面时发送的首条消息
  const initialMessage = ref(null)

  async function handleSend(data, sessionId) {
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
      content: '',
      uploaded_files: data.uploaded_files
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8088/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: sessionId,
          query: data.message,
          agent_config: {
            model: data.agentConfig.model,
            max_iterations: data.agentConfig.maxIterations,
            tools: data.agentConfig.tools
          },
          uploaded_files: data.uploaded_files
        }),
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
          const lines = message.split('\n')
          let eventType = ''
          let eventData = []

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim()
            } else if (line.startsWith('data:')) {
              eventData.push(line.slice(5))
            }
          }

          handleStreamEvent({
            type: eventType,
            content: eventData.join('\n')
          })

          await nextTick()
          scrollToBottom()
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        if (streamingMessage.value) {
          streamingMessage.value.content += '\n\n该消息被停止'
          sessionStore.addMessage(streamingMessage.value)
          streamingMessage.value = null
        }
      }
      throw error
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
        } catch (e) { console.error(e) }
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

  function handleStop() {
    if (abortController.value) {
      abortController.value.abort()
    }
  }

  return {
    isLoading,
    streamingMessage,
    autoScrollEnabled,
    messagesContainer,
    initialMessage,
    handleSend,
    handleStop,
    scrollToBottom
  }
})