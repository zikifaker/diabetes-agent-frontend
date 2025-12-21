<template>
  <div class="home-container">
    <MenuSidebar :sidebar-visible="sidebarVisible" @toggle-sidebar="toggleSidebar" @new-chat="handleNewChat" />

    <main class="main-content" :class="{ 'sidebar-hidden': !sidebarVisible }">
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </div>
        <h1>Diabetes Agent</h1>
        <p>糖尿病诊断智能体</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import MenuSidebar from '@/components/MenuSidebar.vue'

const router = useRouter()
const sessionStore = useSessionStore()
const sidebarVisible = ref(true)

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
}

async function handleNewChat() {
  const session = await sessionStore.createSession()
  router.push(`/chat/${session.id}`)
}
</script>

<style scoped>
.home-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  background: var(--white);
}

.main-content.sidebar-hidden {
  margin-left: 0;
}

.empty-state {
  text-align: center;
  max-width: 600px;
  padding: 40px;
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
</style>
