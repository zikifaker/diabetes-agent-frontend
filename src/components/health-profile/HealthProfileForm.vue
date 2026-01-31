<template>
  <Transition name="fade">
    <div class="modal-overlay">
      <div class="profile-card">
        <header class="profile-header">
          <div class="title-group">
            <h1>我的健康档案</h1>
            <p>完善信息，获取更精准的糖尿病治疗建议</p>
          </div>
          <div class="header-actions">
            <button v-if="!isEditing" @click="isEditing = true" class="btn-edit-outline">
              <EditIcon /> <span>修改资料</span>
            </button>
            <button @click="$emit('close')" class="btn-close">
              <CloseIcon />
            </button>
          </div>
        </header>

        <form @submit.prevent="saveProfile" class="modern-form">
          <div class="form-grid">
            <div class="field-group">
              <div class="group-header">基础信息</div>
              <div class="form-section">
                <label>性别</label>
                <div v-if="!isEditing" class="read-only-value">{{ genderLabel }}</div>
                <select v-else v-model="profile.gender" class="modern-input">
                  <option value="male">男</option>
                  <option value="female">女</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div class="form-section">
                <label>年龄</label>
                <div v-if="!isEditing" class="read-only-value">{{ profile.age || '-' }} 岁</div>
                <input v-else type="number" v-model="profile.age" min="0" placeholder="请输入年龄" class="modern-input">
              </div>
              <div class="form-section">
                <label>身高(cm)</label>
                <div v-if="!isEditing" class="read-only-value">
                  {{ profile.height || '-' }} cm
                </div>
                <div v-else class="dual-input">
                  <input type="number" v-model="profile.height" min="0" placeholder="身高(cm)" class="modern-input">
                </div>
              </div>
              <div class="form-section">
                <label>体重(kg)</label>
                <div v-if="!isEditing" class="read-only-value">
                  {{ profile.weight || '-' }} kg
                </div>
                <div v-else class="dual-input">
                  <input type="number" v-model="profile.weight" min="0" step="0.1" placeholder="体重(kg)"
                    class="modern-input">
                </div>
              </div>
            </div>

            <div class="field-group">
              <div class="group-header">生活习惯</div>
              <div class="form-section">
                <label>吸烟情况</label>
                <div v-if="!isEditing" class="read-only-value">{{ profile.smokingStatus ? '吸烟' : '不吸烟' }}</div>
                <select v-else v-model="profile.smokingStatus" class="modern-input">
                  <option :value="false">不吸烟</option>
                  <option :value="true">吸烟</option>
                </select>
              </div>
              <div class="form-section">
                <label>运动等级</label>
                <div v-if="!isEditing" class="read-only-value">{{ activityLabel }}</div>
                <select v-else v-model="profile.activityLevel" class="modern-input">
                  <option value="sedentary">久坐不动</option>
                  <option value="light">轻度活跃</option>
                  <option value="moderate">中度活跃</option>
                  <option value="heavy">高强度运动</option>
                </select>
              </div>
              <div class="form-section">
                <label>饮食偏好</label>
                <div v-if="!isEditing" class="read-only-value">{{ profile.dietaryPreference }}</div>
                <input v-else v-model="profile.dietaryPreference" placeholder="如：低糖、少盐、素食等" class="modern-input">
              </div>
            </div>

            <div class="field-group">
              <div class="group-header">医疗背景</div>
              <div class="form-section">
                <label>糖尿病类型</label>
                <div v-if="!isEditing" class="read-only-value">{{ diabetesTypeLabel }}</div>
                <select v-else v-model="profile.diabetesType" class="modern-input">
                  <option value="none">无</option>
                  <option value="type1">1型糖尿病</option>
                  <option value="type2">2型糖尿病</option>
                  <option value="gestational">妊娠期糖尿病</option>
                  <option value="other">其他类型</option>
                </select>
              </div>
              <div class="form-section">
                <label>患病年数</label>
                <div v-if="!isEditing" class="read-only-value">{{ profile.diagnosisYear || '-' }}</div>
                <input v-else type="number" v-model="profile.diagnosisYear" min="0" placeholder="请输入确诊年份"
                  class="modern-input">
              </div>
              <div class="form-section">
                <label>治疗模式</label>
                <div v-if="!isEditing" class="read-only-value">{{ therapyModeLabel }}</div>
                <select v-else v-model="profile.therapyMode" class="modern-input">
                  <option value="lifestyle">仅生活方式干预</option>
                  <option value="oral_meds">口服药物</option>
                  <option value="insulin">胰岛素治疗</option>
                  <option value="combined">联合治疗</option>
                </select>
              </div>
              <div class="form-section">
                <label>过敏史</label>
                <div v-if="!isEditing" class="read-only-value">{{ profile.allergies }}</div>
                <input v-else v-model="profile.allergies" placeholder="药物或食物过敏史" class="modern-input">
              </div>
              <div class="form-section">
                <label>当前用药</label>
                <div v-if="!isEditing" class="read-only-value multiline">{{ profile.medication }}</div>
                <textarea v-else v-model="profile.medication" placeholder="请详细列出您正在服用的药物名称和剂量"
                  class="modern-input"></textarea>
              </div>
              <div class="form-section">
                <label>相关并发症</label>
                <div v-if="!isEditing" class="read-only-value multiline">{{ profile.complications }}</div>
                <textarea v-else v-model="profile.complications" placeholder="请描述已确诊的并发症"
                  class="modern-input"></textarea>
              </div>
            </div>
          </div>

          <div class="form-actions-wrapper">
            <Transition name="slide-up">
              <div v-show="isEditing" class="form-actions">
                <button type="button" @click="cancelEdit" class="btn-cancel" :disabled="loading">
                  取消
                </button>
                <button type="submit" class="btn-save" :disabled="loading">
                  <span v-if="loading" class="loader"></span>
                  {{ loading ? '保存中...' : '保存' }}
                </button>
              </div>
            </Transition>
          </div>
        </form>
      </div>

      <div v-if="toast.show" class="toast"
        :class="{ 'toast-success': toast.type === 'success', 'toast-error': toast.type === 'error' }">
        {{ toast.message }}
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useHealthProfileStore } from '@/stores/health_profile'
import { EditIcon, CloseIcon } from '@/icons/common'

const emit = defineEmits(['close'])

const healthProfileStore = useHealthProfileStore()
const { healthProfile } = storeToRefs(healthProfileStore)

const loading = ref(false)
const isEditing = ref(false)

const profile = ref({
  gender: 'male',
  age: null,
  height: null,
  weight: null,
  dietaryPreference: '',
  smokingStatus: false,
  activityLevel: 'sedentary',
  diabetesType: 'none',
  diagnosisYear: null,
  therapyMode: 'lifestyle',
  medication: '',
  allergies: '',
  complications: ''
})

const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

const DIABETES_TYPE_MAP = {
  none: '无',
  type1: '1型糖尿病',
  type2: '2型糖尿病',
  gestational: '妊娠期糖尿病',
  other: '其他类型'
}

const GENDER_MAP = {
  male: '男',
  female: '女',
  other: '其他'
}

const ACTIVITY_MAP = {
  sedentary: '极少运动',
  light: '轻强度',
  moderate: '中强度',
  heavy: '高强度'
}

const THERAPY_MAP = {
  lifestyle: '仅生活方式',
  oral_meds: '口服药物',
  insulin: '胰岛素',
  combined: '联合治疗'
}

const genderLabel = computed(() => GENDER_MAP[profile.value.gender] || '-')
const activityLabel = computed(() => ACTIVITY_MAP[profile.value.activityLevel] || '-')
const therapyModeLabel = computed(() => THERAPY_MAP[profile.value.therapyMode] || '-')
const diabetesTypeLabel = computed(() => DIABETES_TYPE_MAP[profile.value.diabetesType] || '-')

async function saveProfile() {
  loading.value = true
  try {
    if (healthProfile.value) {
      await healthProfileStore.updateProfile(profile.value)
    } else {
      await healthProfileStore.createProfile(profile.value)
    }
    isEditing.value = false
    showToast('档案保存成功')
  } catch (error) {
    console.error(error)
    showToast('档案保存失败', 'error')
  } finally {
    loading.value = false
  }
}

function cancelEdit() {
  if (healthProfile.value) {
    profile.value = { ...healthProfile.value }
  }
  isEditing.value = false
}

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => (toast.value.show = false), 1500)
}

watch(healthProfile, (val) => {
  if (val) profile.value = { ...val }
}, { immediate: true })

onMounted(async () => {
  try {
    await healthProfileStore.fetchProfile()
  } catch (error) {
    console.error('Failed to fetch health profile:', error)
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.profile-card {
  width: 92%;
  max-width: 580px;
  max-height: 85vh;
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;
  position: relative;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.title-group h1 {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.title-group p {
  color: #64748b;
  font-size: 13px;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-edit-outline {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit-outline:hover {
  background: #f8fafc;
  border-color: #cbd5e0;
  color: #4285F4;
}

.btn-edit-outline svg {
  width: 14px;
  height: 14px;
}

.btn-close {
  width: 32px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.modern-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section {
  padding: 8px 0;
}

.form-section label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}

.read-only-value,
.modern-input {
  box-sizing: border-box;
  width: 100%;
  min-height: 46px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.5;
  border-radius: 12px;
  border: 2px solid transparent;
}

.read-only-value {
  background: #f8fafc;
  border-color: #f1f5f9;
  color: #334155;
  display: flex;
  align-items: center;
}

.modern-input {
  background: #fff;
  border-color: #e2e8f0;
  transition: all 0.2s ease;
}

.modern-input:focus {
  border-color: #4285F4;
  outline: none;
  background: #fff;
}

textarea.modern-input,
.read-only-value.multiline {
  min-height: 60px;
  max-height: 300px;
  align-items: flex-start;
  resize: vertical;
}

.form-actions-wrapper {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.form-actions {
  display: flex;
  gap: 12px;
  width: 100%;
  justify-content: flex-end;
  padding-top: 12px;
}

.btn-save,
.btn-cancel {
  padding: 8px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save {
  background: var(--primary-color);
  color: white;
  border: none;
}

.btn-save:hover {
  background: var(--primary-hover);
  color: var(--text-primary);
}

.btn-cancel {
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.btn-cancel:hover {
  background: var(--hover-bg);
  color: var(--text-secondary);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 6px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
  transition: all 0.3s ease;
}

.toast-success {
  background-color: rgba(236, 253, 245, 0.9);
  border: 1px solid #10b981;
  color: #065f46;
}

.toast-error {
  background-color: rgba(254, 242, 242, 0.9);
  border: 1px solid #ef4444;
  color: #991b1b;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.field-group {
  padding: 12px 16px;
  background: #fcfdfe;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  margin-bottom: 15px;
}

.group-header {
  font-size: 16px;
  font-weight: 700;
  color: #4285F4;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-header::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.dual-input {
  display: flex;
  gap: 10px;
}

.dual-input .modern-input {
  flex: 1;
}

.profile-card::-webkit-scrollbar {
  width: 6px;
}

.profile-card::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}

.profile-card::-webkit-scrollbar-track {
  background: transparent;
}
</style>