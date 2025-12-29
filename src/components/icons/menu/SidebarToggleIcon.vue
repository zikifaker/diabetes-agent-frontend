<template>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" :class="{ 'rotate-180': rotated }">
    <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>

<script setup>
defineProps({
  rotated: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.rotate-180 {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}
</style>