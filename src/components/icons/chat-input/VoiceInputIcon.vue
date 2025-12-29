<template>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" :class="['voice-icon', { 'is-listening': isListening }]">
    <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
      :fill="isListening ? '#ef4444' : 'currentColor'" />
    <path d="M17 11C17 14.31 14.31 17 11 17H13M7 11C7 14.31 9.69 17 13 17M12 17V21M8 21H16"
      :stroke="isListening ? '#ef4444' : 'currentColor'" stroke-width="1.5" stroke-linecap="round" />
  </svg>
</template>

<script setup>
defineProps({
  isListening: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.voice-icon {
  transition: all 0.3s ease;
}
</style>