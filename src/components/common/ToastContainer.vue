<template>
  <teleport to="body">
    <div class="toast-container" aria-live="polite">
      <transition-group name="toast" tag="div" class="toast-list">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
          role="alert"
          @click="remove(toast.id)"
        >
          <div class="toast-icon">
            <svg v-if="toast.type === 'error'" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <svg v-else-if="toast.type === 'success'" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <svg v-else viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 4a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H10z" clip-rule="evenodd" />
            </svg>
          </div>

          <span class="toast-message">{{ toast.message }}</span>

          <button class="toast-close" aria-label="Dismiss" @click.stop="remove(toast.id)">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>

          <div class="toast-progress" :class="`toast-progress--${toast.type}`" />
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { useToast } from '../../composables/useToast'

const { toasts, remove } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 13px 14px 16px;
  border-radius: 10px;
  min-width: 280px;
  max-width: 380px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  pointer-events: all;
  position: relative;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.toast--error   { border-left: 4px solid #ef4444; }
.toast--success { border-left: 4px solid #10b981; }
.toast--info    { border-left: 4px solid #4f6ef7; }

.toast-icon { flex-shrink: 0; margin-top: 1px; }
.toast-icon svg { width: 18px; height: 18px; }
.toast--error   .toast-icon { color: #ef4444; }
.toast--success .toast-icon { color: #10b981; }
.toast--info    .toast-icon { color: #4f6ef7; }

.toast-message {
  flex: 1;
  font-size: 13.5px;
  font-weight: 500;
  color: #1f2937;
  line-height: 1.45;
  word-break: break-word;
}

.toast-close {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  display: flex;
  border-radius: 4px;
  transition: color 0.15s;
  margin-top: 1px;
}
.toast-close svg { width: 14px; height: 14px; }
.toast-close:hover { color: #374151; }

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  transform-origin: left;
  animation: shrink 4.5s linear forwards;
  border-radius: 0 0 0 10px;
}
.toast-progress--error   { background: #ef4444; }
.toast-progress--success { background: #10b981; }
.toast-progress--info    { background: #4f6ef7; }

@keyframes shrink {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}

.toast-enter-active { transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.22s ease; }
.toast-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }
.toast-enter-from, .toast-leave-to { transform: translateX(120%); opacity: 0; }

@media (max-width: 480px) {
  .toast-container { bottom: 16px; right: 16px; left: 16px; align-items: stretch; }
  .toast-list { align-items: stretch; }
  .toast { max-width: 100%; }
}
</style>
