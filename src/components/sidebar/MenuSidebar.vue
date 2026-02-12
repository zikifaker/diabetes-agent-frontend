<template>
  <aside class="sidebar" :class="{ hidden: !sidebarVisible }">
    <div class="sidebar-header">
      <button @click="$emit('new-chat')" class="btn-new-chat">
        <NewChatIcon />
        <span class="btn-text">新对话</span>
      </button>

      <router-link to="/my-knowledge-base" class="menu-button">
        <KnowledgeBaseIcon />
        <span class="menu-text">我的知识库</span>
      </router-link>

      <router-link to="/blood-glucose" class="menu-button">
        <BloodGlucoseIcon />
        <span class="menu-text">血糖记录</span>
      </router-link>

      <router-link to="/exercise" class="menu-button">
        <ExerciseIcon />
        <span class="menu-text">运动记录</span>
      </router-link>

      <router-link to="/health-weekly-report" class="menu-button">
        <ViewReportIcon />
        <span class="menu-text">健康周报</span>
      </router-link>

      <div class="section-divider">
        <ChatHistoryIcon />
        <span class="menu-text">会话历史</span>
      </div>
    </div>

    <div class="sessions-list">
      <div v-for="session in sessionStore.sessions" :key="session.id" class="session-item"
        :class="{ active: session.id == route.params.id }" @click="selectSession(session)">
        <div class="session-info">
          <input v-if="editingSessionId === session.id" v-model="editingTitle" class="session-title-input"
            @keydown.enter="confirmRename(session)" @keydown.esc="cancelRename" ref="renameInput" />
          <span v-else class="session-title">
            {{ session.title }}
          </span>
        </div>

        <div class="session-actions">
          <button class="btn-more" @click.stop="toggleSessionMenu(session.id)" aria-label="会话菜单">
            <MenuIcon />
          </button>

          <div v-if="activeSessionMenu === session.id" class="session-menu">
            <button class="menu-item" @click.stop="startRename(session)">重命名</button>
            <button class="menu-item delete" @click.stop="deleteSession(session)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div class="sidebar-footer">
      <div class="user-menu">
        <button @click.stop="toggleUserMenu" class="user-button">
          <img :src="authStore.user?.avatar" :alt="authStore.user?.email" class="user-avatar" />
          <span class="user-name">{{ authStore.user?.email }}</span>
        </button>

        <Transition name="dropdown">
          <div v-show="showUserMenu" class="user-dropdown">
            <button @click="handleShowHealthProfile" class="dropdown-item">
              <HealthProfileIcon />
              <span class="dropdown-text">健康档案</span>
            </button>
            <button @click="handleLogout" class="dropdown-item">
              <LogoutIcon />
              <span class="dropdown-text">退出登录</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <HealthProfileForm v-if="showHealthProfile" @close="showHealthProfile = false" />
  </aside>

  <Teleport to="body">
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal-content">
        <div class="modal-header">
          <h3>确认删除当前会话吗？</h3>
          <button @click="cancelDelete" class="close-button">
            <CloseIcon />
          </button>
        </div>
        <div class="modal-body">
          <p>删除后对话记录无法恢复和找回，请谨慎操作</p>
        </div>
        <div class="modal-footer">
          <button @click="cancelDelete" class="btn btn-cancel">取消</button>
          <button @click="confirmDelete" class="btn btn-delete-confirm">删除</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSessionStore } from '@/stores/session'
import { HealthProfileForm } from '@/components/health-profile'
import {
  NewChatIcon, KnowledgeBaseIcon, BloodGlucoseIcon,
  HealthProfileIcon, ChatHistoryIcon, LogoutIcon,
  ViewReportIcon, ExerciseIcon
} from '@/assets/icons/navigation'
import { MenuIcon, CloseIcon } from '@/assets/icons/common'

defineProps({
  sidebarVisible: Boolean
})

defineEmits(['new-chat'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const sessionStore = useSessionStore()

const showUserMenu = ref(false)
const showHealthProfile = ref(false)

const activeSessionMenu = ref(null)
const showDeleteModal = ref(false)
const sessionToDelete = ref(null)
const editingSessionId = ref(null)
const editingTitle = ref('')
const renameInput = ref(null)

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

function selectSession(session) {
  sessionStore.setCurrentSession(session)
  router.push(`/chat/${session.id}`)
}

function toggleSessionMenu(id) {
  activeSessionMenu.value = activeSessionMenu.value === id ? null : id
}

function deleteSession(session) {
  activeSessionMenu.value = null
  sessionToDelete.value = session
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (sessionToDelete.value.id) {
    await sessionStore.deleteSession(sessionToDelete.value.id)
    if (route.params.id == sessionToDelete.value.id) {
      router.push('/')
    }
    showDeleteModal.value = false
    sessionToDelete.value = null
    activeSessionMenu.value = null
  }
}

function cancelDelete() {
  showDeleteModal.value = false
  sessionToDelete.value = null
  activeSessionMenu.value = null
}

function startRename(session) {
  activeSessionMenu.value = null
  editingSessionId.value = session.id
  editingTitle.value = session.title

  nextTick(() => {
    renameInput.value?.focus()
    renameInput.value?.select()
  })
}

async function confirmRename(session) {
  if (!editingTitle.value.trim()) {
    cancelRename()
    return
  }

  if (editingTitle.value !== session.title) {
    try {
      await sessionStore.updateSessionTitle(
        session.id,
        editingTitle.value.trim()
      )
    } catch (error) {
      console.error('Failed to update session title:', error)
    }
  }
  cancelRename()
}

function cancelRename() {
  editingSessionId.value = null
  editingTitle.value = ''
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function handleShowHealthProfile() {
  showUserMenu.value = false
  showHealthProfile.value = true
}

function handleClickOutside(event) {
  if (showUserMenu.value && !event.target.closest('.user-menu')) {
    showUserMenu.value = false
  }

  if (activeSessionMenu.value && !event.target.closest('.session-actions')) {
    activeSessionMenu.value = null
  }

  if (editingSessionId.value && !event.target.closest('.session-title-input')) {
    cancelRename()
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)

  try {
    await sessionStore.fetchSessions()
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.sidebar {
  width: 240px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  height: 100vh;
  transition: var(--transition);
}

.sidebar.hidden {
  margin-left: -240px;
}

.sidebar-header {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-divider {
  margin-top: 12px;
  padding: 8px 16px;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-new-chat {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--primary-color);
  color: white;
  border-radius: var(--radius);
  font-size: 0.8rem;
  font-weight: 500;
  transition: var(--transition);
  border: none;
  cursor: pointer;
}

.menu-button {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background-color 0.2s;
  text-decoration: none;
  color: inherit;
}

.menu-button:hover {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--primary-color);
  font-weight: 500;
}

button.menu-button {
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-family: inherit;
  font-size: inherit;
}

.sessions-list {
  margin-top: -15px;
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 10px;
  border-radius: 6px;
  margin: 2px 0;
  position: relative;
}

.session-item:hover {
  background-color: var(--hover-bg);
}

.session-item.active {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--primary-color);
  font-weight: 500;
}

.session-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.session-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.85rem;
}

.session-item.active .session-title {
  color: var(--primary-color);
}

.session-actions {
  position: relative;
}

.btn-more {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary);
  opacity: 0;
  cursor: pointer;
  transition: all 0.15s ease;
}

.session-item:hover .btn-more,
.session-item.active .btn-more {
  opacity: 1;
}

.btn-more:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.session-menu {
  position: absolute;
  right: 0;
  transform: none;
  background: #ffffff;
  border-radius: 8px;
  padding: 4px 0;
  min-width: 120px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  border: 1px solid var(--border-color);
  z-index: 1000;
}

.menu-item {
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  text-align: left;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.menu-item.delete {
  color: #dc2626;
}

.session-title-input {
  width: 100%;
  font-size: 0.85rem;
  padding: 2px 4px;
  border-radius: 4px;
  border: 1px solid var(--primary-color);
  outline: none;
}

.sidebar-footer {
  border-top: 1px solid var(--border-color);
  padding: 12px;
}

.user-menu {
  position: relative;
}

.user-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: var(--radius);
  transition: var(--transition);
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}

.user-button:hover {
  background: var(--hover-bg);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.user-dropdown {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 100;
  transform-origin: bottom center;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.25s cubic-bezier(0.24, 0.22, 0.31, 1.07);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 14px;
  transition: background-color 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;
}

.dropdown-item:hover {
  background: rgba(59, 130, 246, 0.1);
}

.dropdown-text {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: 500;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: #ffffff;
  border-radius: var(--radius);
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: modalFadeIn 0.2s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-button {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-button:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: var(--radius);
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-cancel {
  background: var(--bg-color);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.btn-cancel:hover {
  background: var(--hover-bg);
}

.btn-delete-confirm {
  background: #ef4444;
  color: white;
}

.btn-delete-confirm:hover {
  background: #dc2626;
}

.menu-text {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: 500;
}

.btn-text {
  line-height: 1;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
  }
}
</style>
