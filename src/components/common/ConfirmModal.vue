<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="modelValue" class="backdrop" @mousedown.self="$emit('cancel')">
        <div class="modal" role="alertdialog" aria-modal="true" :aria-labelledby="titleId" :aria-describedby="descId">

          <!-- Icon -->
          <div class="icon-wrap" :class="`icon-wrap--${variant}`">
            <!-- Danger / default: trash / warning triangle -->
            <svg v-if="variant === 'danger'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          <!-- Text -->
          <h3 :id="titleId" class="title">{{ title }}</h3>
          <p  :id="descId"  class="desc">{{ message }}</p>

          <!-- Actions -->
          <div class="actions">
            <button class="btn btn--ghost" @click="$emit('cancel')">
              {{ cancelLabel }}
            </button>
            <button
              class="btn"
              :class="variant === 'danger' ? 'btn--danger' : 'btn--primary'"
              :disabled="loading"
              @click="$emit('confirm')"
            >
              <svg v-if="loading" class="spin" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
              </svg>
              {{ loading ? 'Deleting…' : confirmLabel }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
}>(), {
  title:        'Are you sure?',
  message:      'This action cannot be undone.',
  confirmLabel: 'Confirm',
  cancelLabel:  'Cancel',
  variant:      'danger',
  loading:      false,
})

defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const uid      = Math.random().toString(36).slice(2)
const titleId  = computed(() => `cm-title-${uid}`)
const descId   = computed(() => `cm-desc-${uid}`)
</script>

<style scoped>
/* ── Backdrop ── */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
}

/* ── Modal card ── */
.modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  padding: 32px 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22);
}

/* ── Icon ── */
.icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  flex-shrink: 0;
}
.icon-wrap svg { width: 26px; height: 26px; }

.icon-wrap--danger  { background: #fef2f2; color: #dc2626; }
.icon-wrap--warning { background: #fffbeb; color: #d97706; }

/* ── Text ── */
.title {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px;
}
.desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px;
  line-height: 1.55;
}

/* ── Buttons ── */
.actions {
  display: flex;
  gap: 10px;
  width: 100%;
}
.btn {
  flex: 1;
  padding: 10px 0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.15s, opacity 0.15s;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn svg { width: 14px; height: 14px; }

.btn--ghost  { background: #f3f4f6; color: #374151; }
.btn--ghost:hover:not(:disabled) { background: #e5e7eb; }

.btn--danger  { background: #dc2626; color: #fff; }
.btn--danger:hover:not(:disabled) { background: #b91c1c; }

.btn--primary { background: #4f6ef7; color: #fff; }
.btn--primary:hover:not(:disabled) { background: #3b56e0; }

/* ── Spinner ── */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.7s linear infinite; }

/* ── Transition ── */
.confirm-fade-enter-active,
.confirm-fade-leave-active { transition: opacity 0.18s ease; }
.confirm-fade-enter-from,
.confirm-fade-leave-to    { opacity: 0; }
</style>
