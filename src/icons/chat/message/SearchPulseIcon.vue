<template>
  <div class="search-pulse-icon">
    <div class="pulse"></div>
  </div>
</template>

<style scoped>
.search-pulse-icon {
  width: 14px;
  height: 14px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse {
  width: 8px;
  height: 8px;
  background-color: currentColor;
  border-radius: 50%;
  position: relative;
}

.pulse::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: currentColor;
  animation: pulse-ring 1.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.7);
    opacity: 0.8;
  }

  80%,
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}
</style>
