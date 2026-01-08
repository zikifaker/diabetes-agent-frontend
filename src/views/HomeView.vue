<template>
  <div class="home-container">
    <MenuSidebar :sidebar-visible="sidebarVisible" @toggle-sidebar="toggleSidebar" />

    <main class="main-content" :class="{ 'sidebar-hidden': !sidebarVisible }">
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
        <ChatInput @send="onSend" @stop="chatStore.handleStop" :loading="isLoading" />
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
import MenuSidebar from '@/components/layout/MenuSidebar.vue'
import ChatInput from '@/components/chat/input/ChatInput.vue'
import { MainIcon } from '@/components/icons'

const chatStore = useChat()
const sessionStore = useSessionStore()
const router = useRouter()

const { isLoading, messageFromHome } = storeToRefs(chatStore)
const sidebarVisible = ref(true)

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
}

async function onSend(data) {
  try {
    const session = await sessionStore.createSession()
    sessionStore.messages = [] 
    sessionStore.setCurrentSession(session)
    
    messageFromHome.value = data
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

.btn-start {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: var(--primary-color);
  color: white;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 500;
  transition: var(--transition);
}

.btn-start:hover {
  background: var(--primary-hover);
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
  transform: translateY(-2px);
}

.input-area-wrapper {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding-bottom: 24px;
}
</style>
