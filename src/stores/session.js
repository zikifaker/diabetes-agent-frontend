import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useSessionStore = defineStore('session', () => {
  const sessions = ref([])
  const currentSession = ref(null)
  const messages = ref([])

  async function fetchSessions() {
    const response = await api.get('/sessions')
    const sessionsData = response.data.data.sessions || []
    sessions.value = sessionsData.map(session => ({
      id: session.session_id,
      title: session.title
    }))
  }

  async function createSession() {
    const response = await api.post('/session')
    const sessionData = response.data.data
    const session = {
      id: sessionData.session_id,
      title: sessionData.title
    }
    sessions.value.unshift(session)
    return session
  }

  async function deleteSession(id) {
    await api.delete(`/session/${id}`)
    sessions.value = sessions.value.filter(s => s.id !== id)
    if (currentSession.value?.id === id) {
      currentSession.value = null
      messages.value = []
    }
  }

  async function fetchMessages(sessionId) {
    const response = await api.get(`/session/${sessionId}/messages`)
    const messagesData = response.data.data.messages || []
    messages.value = messagesData.map((msg, index) => ({
      id: index,
      created_at: msg.created_at,
      role: msg.role,
      thinking_complete: true,
      immediate_steps: msg.immediate_steps,
      tool_call_results: msg.tool_call_results,
      content: msg.content
    }))
  }

  async function updateSessionTitle(id, title) {
    await api.put(`/session/${id}/title`, {
      session_id: id,
      title: title
    })
    const session = sessions.value.find(s => s.id === id)
    if (session) {
      session.title = title
    }
  }

  function setCurrentSession(session) {
    currentSession.value = session
  }

  function addMessage(message) {
    messages.value.push(message)
  }

  return {
    sessions,
    currentSession,
    messages,
    fetchSessions,
    createSession,
    deleteSession,
    fetchMessages,
    updateSessionTitle,
    setCurrentSession,
    addMessage
  }
})
