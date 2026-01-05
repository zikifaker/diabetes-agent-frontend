<template>
  <div class="voice-input-container">
    <transition name="fade">
      <div v-if="error" class="voice-error">
        {{ error }}
      </div>
    </transition>
    <div class="tooltip-container">
      <button @click="toggleVoiceInput" class="btn-voice" :class="{ 'listening': isListening }"
        :aria-label="isListening ? '停止语音输入' : '开始语音输入'" :disabled="!isSupported">
        <span v-if="isListening" class="pulse-animation"></span>
        <VoiceInputIcon :is-listening="isListening" />
        <span class="tooltip">{{ isListening ? '停止语音输入' : '语音输入' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import api from '@/services/api'
import workletURL from '@/utils/recorder_worklet.js?url'
import { VoiceInputIcon } from '@/components/icons'

const props = defineProps({
  lang: {
    type: String,
    default: 'zh-CN'
  },
  isListening: {
    type: Boolean,
    default: false
  },
  errorTimeout: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['result', 'update:isListening'])

const isListening = ref(props.isListening)
const isSupported = ref(true)
const error = ref(null)

let mediaRecorder = null
let audioChunks = []
let audioContext = null
let workletNode = null
let audioData = []
let errorTimer = null

const toggleVoiceInput = () => {
  isListening.value ? stopListening() : startListening()
}

const startListening = async () => {
  try {
    const sampleRate = 16000
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: sampleRate,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      }
    })

    audioContext = new window.AudioContext({
      sampleRate: sampleRate
    })
    await audioContext.audioWorklet.addModule(workletURL)

    const source = audioContext.createMediaStreamSource(stream)
    workletNode = new AudioWorkletNode(audioContext, 'recorder-processor')

    workletNode.port.onmessage = (e) => {
      audioData.push(e.data.buffer)
    }

    source.connect(workletNode)
    workletNode.connect(audioContext.destination)

    mediaRecorder = new MediaRecorder(stream)

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      source.disconnect()
      workletNode.disconnect()

      const wavBlob = createWAVBlob(audioData, sampleRate)
      await fetchVoiceRecognitionAPI(wavBlob)
      audioChunks = []
      audioData = []
    }

    mediaRecorder.start()
    isListening.value = true
    emit('update:isListening', true)
  } catch (error) {
    setError('无法访问麦克风')
    console.error('Error accessing microphone:', error)
  }
}

// 创建 PCM 编码的 WAV 文件
function createWAVBlob(pcmArrays, sampleRate) {
  const pcmData = new Int16Array(pcmArrays.reduce((acc, val) => acc + val.length, 0))
  let offset = 0
  for (const chunk of pcmArrays) {
    pcmData.set(chunk, offset)
    offset += chunk.length
  }

  const wavData = new DataView(new ArrayBuffer(44 + pcmData.length * 2))

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeString(wavData, 0, 'RIFF')
  wavData.setUint32(4, 36 + pcmData.length * 2, true)
  writeString(wavData, 8, 'WAVE')
  writeString(wavData, 12, 'fmt ')
  wavData.setUint32(16, 16, true)
  wavData.setUint16(20, 1, true)
  wavData.setUint16(22, 1, true)
  wavData.setUint32(24, sampleRate, true)
  wavData.setUint32(28, sampleRate * 2, true)
  wavData.setUint16(32, 2, true)
  wavData.setUint16(34, 16, true)
  writeString(wavData, 36, 'data')
  wavData.setUint32(40, pcmData.length * 2, true)

  for (let i = 0; i < pcmData.length; i++) {
    wavData.setInt16(44 + (i * 2), pcmData[i], true)
  }

  return new Blob([wavData], { type: 'audio/wav' })
}

const stopListening = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  isListening.value = false
  emit('update:isListening', false)
}

const fetchVoiceRecognitionAPI = async (audioBlob) => {
  try {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.wav')

    const response = await api.post('/voice-recognition', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      }
    })

    emit('result', [{
      transcript: response.data.data?.text || ''
    }])
  } catch (error) {
    setError('语音识别服务不可用')
    console.error('Voice recognition API error:', error)
  }
}

const setError = (message) => {
  if (errorTimer) {
    clearTimeout(errorTimer)
    errorTimer = null
  }

  error.value = message

  if (message && props.errorTimeout > 0) {
    errorTimer = setTimeout(() => {
      error.value = null
      errorTimer = null
    }, props.errorTimeout)
  }
}

onMounted(() => {
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    isSupported.value = false
    setError('浏览器不支持录音功能')
  }
})

onUnmounted(() => {
  if (errorTimer) {
    clearTimeout(errorTimer)
    errorTimer = null
  }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }

  isListening.value = false
  error.value = null
})

watch(() => props.isListening, (newVal) => {
  if (newVal !== isListening.value) {
    newVal ? startListening() : stopListening()
  }
})
</script>

<style scoped>
.voice-input-container {
  position: relative;
  display: inline-block;
  line-height: 0;
}

.tooltip-container {
  position: relative;
  display: inline-block;
}

.tooltip {
  visibility: hidden;
  width: auto;
  min-width: 60px;
  background-color: var(--color-tooltip-bg, #333);
  color: var(--color-tooltip-text, #fff);
  text-align: center;
  border-radius: 4px;
  padding: 4px 8px;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%) translateY(5px);
  opacity: 0;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: var(--color-tooltip-bg, #333) transparent transparent transparent;
  }
}

.pulse-animation {
  position: absolute;
  width: 40px;
  height: 40px;
  background-color: rgba(239, 68, 68, 0.2);
  border-radius: 50%;
  animation: pulse 1.5s infinite;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -50%);
  top: 50%;
  left: 50%;
}

.btn-voice {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background: none;
  color: var(--color-text);
  padding: 8px;

  &:hover:not(:disabled) {
    background-color: var(--color-hover-bg);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.listening {
    color: #ef4444;
  }

  &:hover .tooltip {
    visibility: visible;
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 1;
  }

  70% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0;
  }

  100% {
    opacity: 0;
  }

  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

.voice-error {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #fef2f2;
  color: #dc2626;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
