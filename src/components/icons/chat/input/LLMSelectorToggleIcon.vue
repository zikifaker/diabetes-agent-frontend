<template>
  <div class="dropdown-arrows">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 9L12 4L17 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
        class="arrow-path up" />
      <path d="M7 15L12 20L17 15" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
        stroke-linejoin="round" class="arrow-path down" />
    </svg>
  </div>
</template>

<style scoped>
.dropdown-arrows {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s ease;
}

.arrow-path {
  transition: stroke-width 0.2s ease, opacity 0.2s ease;
}
</style>