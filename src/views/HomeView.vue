<template>
  <div class="home-container">
    <MenuSidebar :sidebar-visible="sidebarVisible" />

    <main class="main-content" :class="{ 'sidebar-hidden': !sidebarVisible }">
      <div class="chat-header">
        <button @click="toggleSidebar" class="btn-icon">
          <MenuSidebarToggleIcon :rotated="!sidebarVisible" />
        </button>
        <LLMSelector v-model:modelValue="selectedLLM" :llm-options="llmOptions" class="llm-selector" />
      </div>

      <div class="hero-section">
        <div class="empty-state">
          <div class="empty-state-icon">
            <MainIcon />
          </div>
          <h1>Diabetes Agent</h1>
          <p>糖尿病诊断智能体</p>
        </div>
      </div>

      <div class="input-area-wrapper">
        <ChatInput @send="onSend" @stop="chatStore.handleStop" :model="selectedLLM.id" :loading="isLoading"
          :disableFileUploadButton="true" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useChat } from '@/stores/chat'
import { useSessionStore } from '@/stores/session'
import { useLLMOptionsStore } from '@/stores/llm_options'
import { MenuSidebar } from '@/components/layout'
import { LLMSelector, ChatInput } from '@/components/chat/input'
import { MainIcon } from '@/icons/common'
import { MenuSidebarToggleIcon } from '@/icons/navigation'

const chatStore = useChat()
const sessionStore = useSessionStore()
const llmOptionsStore = useLLMOptionsStore()
const router = useRouter()

const { isLoading, initialMessage } = storeToRefs(chatStore)
const { llmOptions, selectedLLM } = storeToRefs(llmOptionsStore)

const sidebarVisible = ref(true)

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
}

async function onSend(data) {
  try {
    const session = await sessionStore.createSession()
    sessionStore.setCurrentSession(session)
    sessionStore.messages = []

    initialMessage.value = data
    router.push(`/chat/${session.id}`)
  } catch (error) {
    console.error('Error sending message:', error)
  }
}
</script>

<style scoped>
.home-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--white);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease-in-out;
  overflow: hidden;
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

.hero-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  text-align: center;
  max-width: 600px;
}

.empty-state-icon {
  color: var(--primary-color);
  margin-bottom: 24px;
}

.empty-state h1 {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.empty-state p {
  font-size: 18px;
  color: var(--text-secondary);
  margin-bottom: 32px;
}

.input-area-wrapper {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding-bottom: 24px;
}
</style>
