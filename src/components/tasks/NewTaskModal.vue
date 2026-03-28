<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @mousedown.self="close">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="modal-header">
            <h2 id="modal-title">New Task</h2>
            <button class="modal-close" aria-label="Close" @click="close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Loading templates -->
          <div v-if="templatesLoading" class="modal-state">
            <span class="spinner" />
            <span>Loading templates…</span>
          </div>

          <!-- Templates failed -->
          <div v-else-if="templatesFailed" class="modal-state modal-state--error">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            Could not load templates.
          </div>

          <!-- Form -->
          <form v-else class="modal-body" @submit.prevent="submit">
            <div class="field">
              <label for="nt-template">Request <span class="required">*</span></label>
              <select
                id="nt-template"
                v-model="selectedTemplateId"
                required
                :disabled="submitting"
                @change="onTemplateChange"
              >
                <option value="">— Select a request —</option>
                <option v-for="t in templates" :key="t.id" :value="t.id">
                  {{ t.request_name }}
                </option>
              </select>
            </div>

            <div v-if="selectedTemplate" class="field">
              <SchemaForm
                :schema="selectedTemplate.request_schema"
                :model-value="schemaValues"
                :disabled="submitting"
                @update:model-value="schemaValues = $event"
              />
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-cancel" :disabled="submitting" @click="close">
                Cancel
              </button>
              <button type="submit" class="btn-submit" :disabled="submitting || !selectedTemplateId">
                <span v-if="submitting" class="spinner spinner--sm" />
                {{ submitting ? 'Creating…' : 'Create Task' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getTaskTemplates, addNewTask, type TaskTemplate } from '../../services/tasksService'
import { useAuthStore } from '../../stores/auth'
import { useToast } from '../../composables/useToast'
import SchemaForm from './SchemaForm.vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'created'): void
}>()

const authStore = useAuthStore()
const toast = useToast()

const templatesLoading = ref(false)
const templatesFailed = ref(false)
const templates = ref<TaskTemplate[]>([])
const selectedTemplateId = ref<number | ''>('')
const schemaValues = ref<Record<string, unknown>>({})
const submitting = ref(false)

const selectedTemplate = computed<TaskTemplate | null>(() =>
  templates.value.find((t) => t.id === selectedTemplateId.value) ?? null,
)

function onTemplateChange() {
  schemaValues.value = {}
}

function close() {
  if (submitting.value) return
  emit('update:modelValue', false)
}

async function loadTemplates() {
  templatesLoading.value = true
  templatesFailed.value = false
  try {
    templates.value = await getTaskTemplates()
  } catch {
    templatesFailed.value = true
    toast.error('Failed to load task templates.')
  } finally {
    templatesLoading.value = false
  }
}

async function submit() {
  if (!selectedTemplate.value || authStore.userId === null) return

  submitting.value = true
  try {
    const body = schemaValues.value
    await addNewTask({
      userId: authStore.userId,
      requestApplicationId: 5,
      requestTemplateId: selectedTemplate.value.id,
      requestBody: Object.keys(body).length ? body : null,
    })
    emit('update:modelValue', false)
    emit('created')
  } catch {
    toast.error('Failed to create task. Please try again.')
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      selectedTemplateId.value = ''
      schemaValues.value = {}
      loadTemplates()
    }
  },
)
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 20, 50, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f3f4f6;
}
.modal-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: #1a1f3c;
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  transition: color 0.2s, background 0.2s;
}
.modal-close svg { width: 20px; height: 20px; }
.modal-close:hover { color: #374151; background: #f3f4f6; }

.modal-state {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 32px 24px;
  font-size: 14px;
  color: #6b7280;
}
.modal-state--error { color: #dc2626; }
.modal-state--error svg { width: 18px; height: 18px; flex-shrink: 0; }

.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}
.required { color: #ef4444; }

.field select,
.field input {
  padding: 9px 12px;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #f9fafb;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}
.field select:focus,
.field input:focus {
  border-color: #4f6ef7;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(79, 110, 247, 0.12);
}
.field select:disabled,
.field input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

.btn-cancel {
  padding: 9px 18px;
  background: transparent;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: border-color 0.2s;
}
.btn-cancel:hover:not(:disabled) { border-color: #9ca3af; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-submit {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 22px;
  background: #4f6ef7;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-submit:hover:not(:disabled) { background: #3b56e0; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top-color: #4f6ef7;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
.spinner--sm {
  width: 14px;
  height: 14px;
  border-color: rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
}

@keyframes spin { to { transform: rotate(360deg); } }

.modal-enter-active,
.modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-active .modal,
.modal-leave-active .modal { transition: transform 0.2s ease, opacity 0.2s ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
.modal-enter-from .modal,
.modal-leave-to .modal { transform: translateY(-16px); opacity: 0; }

@media (max-width: 480px) {
  .modal { border-radius: 12px; }
  .modal-body { padding: 16px; }
  .modal-header { padding: 16px 16px 12px; }
}
</style>
