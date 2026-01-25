<template>
  <svg :class="{ 'expanded': expanded }" class="toggle-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>

<script setup>
defineProps({
  expanded: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.toggle-icon {
  transition: transform 0.3s ease;
}

.toggle-icon.expanded {
  transform: rotate(180deg);
}
</style>