<template>
  <aside class="sidebar" :class="{ hidden: !sidebarVisible }">
    <div class="sidebar-header">
      <button @click="$emit('new-chat')" class="btn-new-chat">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 4V20M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <span class="btn-text">新对话</span>
      </button>

      <router-link to="/my-knowledge-base" class="btn-knowledge-base">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="menu-icon">
          <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path
            d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="menu-text">我的知识库</span>
      </router-link>

      <div class="section-divider">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="menu-icon">
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
        <span class="menu-text">会话历史</span>
      </div>
    </div>

    <div class="sessions-list">
      <div v-for="session in sessionStore.sessions" :key="session.id" class="session-item"
        :class="{ active: session.id == route.params.id }" @click="selectSession(session)">
        <div class="session-info">
          <input v-if="editingSessionId === session.id" v-model="editingTitle" class="session-title-input"
            @keydown.enter="confirmRename(session)" @keydown.esc="cancelRename" @blur="confirmRename(session)"
            ref="renameInput" />
          <span v-else class="session-title">
            {{ session.title }}
          </span>
        </div>

        <div class="session-actions">
          <button class="btn-more" @click.stop="toggleSessionMenu(session.id)" aria-label="会话菜单">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="6" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="18" r="1.5" fill="currentColor" />
            </svg>
          </button>

          <div v-if="activeMenu === session.id" class="session-menu">
            <button class="menu-item" @click.stop="startRename(session)">重命名</button>
            <button class="menu-item delete" @click.stop="deleteSession(session.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div class="sidebar-footer">
      <div class="user-menu">
        <button @click="toggleUserMenu" class="user-button">
          <img :src="authStore.user?.avatar || 'https://via.placeholder.com/32'" :alt="authStore.user?.email"
            class="user-avatar" />
          <span class="user-name">{{ authStore.user?.email }}</span>
        </button>

        <div v-if="showUserMenu" class="user-dropdown">
          <div class="user-info">
            <img :src="authStore.user?.avatar || 'https://via.placeholder.com/48'" :alt="authStore.user?.email"
              class="user-avatar-large" />
            <div>
              <div class="user-name-large">{{ authStore.user?.email }}</div>
            </div>
          </div>
          <div class="dropdown-divider"></div>
          <button @click="handleLogout" class="dropdown-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            退出登录
          </button>
        </div>
      </div>
    </div>
  </aside>

  <Teleport to="body">
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal-content">
        <div class="modal-header">
          <h3>确认删除当前会话吗？</h3>
          <button @click="cancelDelete" class="close-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
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

defineProps({
  sidebarVisible: Boolean
})

defineEmits(['toggle-sidebar', 'new-chat'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const sessionStore = useSessionStore()

const showUserMenu = ref(false)

const showDeleteModal = ref(false)
const sessionToDelete = ref(null)

const activeMenu = ref(null)
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
  activeMenu.value = activeMenu.value === id ? null : id
}

function deleteSession(id) {
  activeMenu.value = null
  sessionToDelete.value = id
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (sessionToDelete.value) {
    await sessionStore.deleteSession(sessionToDelete.value)
    if (route.params.id == sessionToDelete.value) {
      router.push('/')
    }
    showDeleteModal.value = false
    sessionToDelete.value = null
    activeMenu.value = null
  }
}

function cancelDelete() {
  showDeleteModal.value = false
  sessionToDelete.value = null
  activeMenu.value = null
}

function startRename(session) {
  activeMenu.value = null
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
    await sessionStore.updateSessionTitle(
      session.id,
      editingTitle.value.trim()
    )
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

function handleClickOutside(event) {
  if (showUserMenu.value && !event.target.closest('.user-menu')) {
    showUserMenu.value = false
  }
}

onMounted(async () => {
  await sessionStore.fetchSessions()
  document.addEventListener('click', handleClickOutside)
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

.btn-knowledge-base {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background-color 0.2s;
  text-decoration: none;
  color: inherit;
}

.btn-knowledge-base:hover {
  background-color: var(--bg-hover);
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
  top: calc(100% + 6px);
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
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background: var(--bg-hover);
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
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 8px;
  background: var(--white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 100;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.user-avatar-large {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.user-name-large {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 14px;
  transition: var(--transition);
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}

.dropdown-item:hover {
  background: var(--hover-bg);
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

.menu-icon {
  flex-shrink: 0;
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
