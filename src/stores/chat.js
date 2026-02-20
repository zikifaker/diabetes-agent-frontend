import { ref, nextTick } from 'vue'
import { defineStore } from 'pinia'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useSessionStore } from '@/stores/session'
import.meta.env.VITE_API_BASE_URL

export const useChat = defineStore('chat', () => {
  const sessionStore = useSessionStore()

  const isLoading = ref(false)
  const streamingMessage = ref(null)
  const abortController = ref(null)
  const autoScrollEnabled = ref(true)
  const messagesContainer = ref(null)
  const initialMessage = ref(null)

  async function handleSend(data, sessionId) {
    if (!data.message && !data.uploaded_files?.length) return

    abortController.value = new AbortController()
    isLoading.value = true

    const userMessage = {
      createdAt: new Date(),
      role: 'human',
      content: data.message,
      uploadedFiles: data.uploadedFiles || []
    }
    sessionStore.addMessage(userMessage)

    streamingMessage.value = {
      createdAt: new Date(),
      role: 'ai',
      thinkingComplete: false,
      intermediateSteps: '',
      toolCallResults: [],
      content: '',
      parsingUploadedFiles: false,
      retrievingKnowledgeBase: false,
      retrievingKnowledgeBaseChunkNum: 0
    }

    try {
      await fetchEventSource(`${import.meta.env.VITE_API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          session_id: sessionId,
          query: data.message,
          agent_config: {
            model: data.agentConfig?.model,
            max_iterations: data.agentConfig?.maxIterations,
            tools: data.agentConfig?.tools
          },
          uploaded_files: data.uploadedFiles,
          enable_knowledge_base_retrieval: data.enableKnowledgeBaseRetrieval
        }),
        signal: abortController.value.signal,
        openWhenHidden: true,

        onmessage(ev) {
          handleStreamEvent({
            type: ev.event,
            content: ev.data
          })

          nextTick(() => scrollToBottom())
        },

        onerror(err) {
          if (err.name === 'AbortError') return
          throw err
        },

        onclose() {
          finishStreaming()
        }
      })
    } catch (error) {
      console.error('Chat Error:', error)
      handleStreamEvent({
        type: 'error',
        content: error.message
      })
    } finally {
      isLoading.value = false
    }
  }

  function handleStreamEvent(event) {
    if (!streamingMessage.value) return

    switch (event.type) {
      case 'file_parse_start':
        streamingMessage.value.parsingUploadedFiles = true
        break

      case 'file_parse_done':
        streamingMessage.value.parsingUploadedFiles = false
        break

      case 'kb_retrieval_start':
        streamingMessage.value.retrievingKnowledgeBase = true
        break

      case 'kb_retrieval_done':
        streamingMessage.value.retrievingKnowledgeBase = false
        break

      case 'kb_retrieval_chunk_num':
        streamingMessage.value.retrievingKnowledgeBaseChunkNum = Number(parseContent(event.content))
        break

      case 'intermediate_steps':
        streamingMessage.value.intermediateSteps += parseContent(event.content)
        break

      case 'tool_call_results':
        const result = parseContent(event.content)
        streamingMessage.value.toolCallResults.push(result)
        break

      case 'final_answer':
        if (!streamingMessage.value.thinkingComplete) {
          streamingMessage.value.thinkingComplete = true
        }
        streamingMessage.value.content += parseContent(event.content)
        break

      case 'done':
        finishStreaming()
        break

      case 'error':
        streamingMessage.value.content = "系统错误，请稍后重试"
        finishStreaming()
        break
    }
  }

  function parseContent(rawContent) {
    try {
      const parsed = JSON.parse(rawContent)
      return typeof parsed === 'object' ? (parsed.content ?? rawContent) : parsed
    } catch {
      return rawContent
    }
  }

  function finishStreaming() {
    if (streamingMessage.value) {
      streamingMessage.value.thinkingComplete = true
      sessionStore.addMessage({ ...streamingMessage.value })
      streamingMessage.value = null
    }
    isLoading.value = false
  }

  function scrollToBottom() {
    if (!autoScrollEnabled.value || !messagesContainer.value) return
    const el = messagesContainer.value
    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth'
    })
  }

  function handleStop() {
    if (abortController.value) {
      abortController.value.abort()
      if (streamingMessage.value) {
        streamingMessage.value.content += '\n\n[会话已由用户停止]'
        finishStreaming()
      }
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