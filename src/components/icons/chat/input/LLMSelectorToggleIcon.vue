<template>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="dropdown-arrow"
    :class="{ 'rotate-180': showDropdown }">
    <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>

<script setup>
defineProps({
  showDropdown: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.dropdown-arrow {
  transition: transform 0.2s ease;
}

.dropdown-arrow.rotate-180 {
  transform: rotate(180deg);
}
</style>