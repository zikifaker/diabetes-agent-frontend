<template>
  <div class="home-container">
    <MenuSidebar :sidebar-visible="sidebarVisible" @show-health-profile="showHealthProfileModal = true" />

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

    <div v-if="showProfileModal" class="modal-overlay" @click.self="showProfileModal = false">
      <div class="modal-content profile-modal">
        <div class="modal-icon">
          <MainIcon />
        </div>
        <h3>完善健康档案</h3>
        <p>为了为您提供更精准的饮食建议与血糖分析，请先填写您的健康基础信息。 </p>
        <div class="modal-footer">
          <button @click="showProfileModal = false" class="btn-secondary">稍后填写</button>
          <button @click="navigateToHealthProfile" class="btn-primary">
            <span>前往填写</span>
            <ArrowIcon />
          </button>
        </div>
      </div>
    </div>

    <HealthProfileForm v-if="showHealthProfileModal" @close="showHealthProfileModal = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useChat } from '@/stores/chat'
import { useSessionStore } from '@/stores/session'
import { useLLMOptionsStore } from '@/stores/llm_options'
import { useHealthProfileStore } from '@/stores/health_profile'
import MenuSidebar from '@/components/layout/MenuSidebar.vue'
import HealthProfileForm from '@/components/health-profile/HealthProfileForm.vue'
import ChatInput from '@/components/chat/input/ChatInput.vue'
import LLMSelector from '@/components/chat/input/LLMSelector.vue'
import { MainIcon, ArrowIcon } from '@/icons/common'
import { MenuSidebarToggleIcon } from '@/icons/navigation'

const chatStore = useChat()
const sessionStore = useSessionStore()
const llmOptionsStore = useLLMOptionsStore()
const healthProfileStore = useHealthProfileStore();
const router = useRouter()

const { isLoading, initialMessage } = storeToRefs(chatStore)
const { llmOptions, selectedLLM } = storeToRefs(llmOptionsStore)
const { healthProfile } = storeToRefs(healthProfileStore)

const sidebarVisible = ref(true)
const showProfileModal = ref(false)
const showHealthProfileModal = ref(false)

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

function navigateToHealthProfile() {
  showProfileModal.value = false
  showHealthProfileModal.value = true
}

onMounted(async () => {
  try {
    await healthProfileStore.fetchProfile()
    if (!healthProfile.value) {
      showProfileModal.value = true
    }
  } catch (error) {
    console.error("Failed to fetch health profile:", error)
  }
})
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal-content.profile-modal {
  background: white;
  padding: 32px;
  border-radius: 20px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  text-align: center;
  max-width: 440px;
  width: 90%;
  border: 1px solid rgba(0, 0, 0, 0.05);
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-icon {
  width: 64px;
  height: 64px;
  color: var(--primary-color, #4285F4);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.modal-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.modal-content p {
  font-size: 15px;
  line-height: 1.6;
  color: #64748b;
  margin-bottom: 32px;
}

.modal-content p strong {
  color: var(--primary-color);
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-secondary {
  flex: 1;
  padding: 12px 20px;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 12px;
  font-weight: 500;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.btn-primary {
  flex: 1.5;
  padding: 12px 20px;
  background: var(--primary-color, #4285F4);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 500;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.2);
}

.btn-primary:hover {
  background: #3367D6;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(66, 133, 244, 0.3);
}

.btn-primary:hover .arrow-icon {
  transform: translateX(4px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
