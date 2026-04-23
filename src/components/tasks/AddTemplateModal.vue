<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @mousedown.self="close">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="atm-title">
          <!-- Header -->
          <div class="modal-header">
            <h2 id="atm-title">New Task Template</h2>
            <button class="modal-close" aria-label="Close" @click="close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <form class="modal-body" @submit.prevent="submit">
            <!-- Basic fields -->
            <div class="section-title">General</div>

            <div class="field">
              <label for="atm-name">Template name <span class="req">*</span></label>
              <input
                id="atm-name"
                v-model.trim="form.request_name"
                type="text"
                placeholder="e.g. Send SMS Campaign"
                required
                :disabled="submitting"
              />
            </div>

            <div class="field">
              <label for="atm-url">Request URL</label>
              <input
                id="atm-url"
                v-model.trim="form.request_url"
                type="url"
                placeholder="https://api.example.com/endpoint"
                :disabled="submitting"
              />
            </div>

            <div class="field">
              <label for="atm-auth">Authentication method</label>
              <select id="atm-auth" v-model="form.authentication_method" :disabled="submitting">
                <option value="">— None —</option>
                <option value="BEARER">Bearer token</option>
                <option value="API_KEY">API Key</option>
                <option value="BASIC">Basic Auth</option>
              </select>
            </div>

            <!-- Schema builder -->
            <div class="section-title section-title--gap">
              Request schema
              <button type="button" class="btn-toggle-json" @click="jsonPreview = !jsonPreview">
                {{ jsonPreview ? 'Hide JSON' : 'Show JSON' }}
              </button>
            </div>

            <div v-if="jsonPreview" class="json-preview">
              <pre>{{ schemaJson }}</pre>
            </div>

            <div class="schema-builder">
              <!-- Required array toggle -->
              <div class="schema-meta">
                <div class="schema-type-row">
                  <label class="inline-label">Root type</label>
                  <span class="type-badge">object</span>
                </div>
              </div>

              <!-- Properties list -->
              <div v-if="properties.length" class="prop-list">
                <div
                  v-for="(prop, idx) in properties"
                  :key="prop.key"
                  class="prop-row"
                >
                  <div class="prop-fields">
                    <input
                      v-model.trim="prop.name"
                      class="prop-input prop-name"
                      type="text"
                      placeholder="Property name"
                      :disabled="submitting"
                    />
                    <select v-model="prop.type" class="prop-select" :disabled="submitting">
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                      <option value="object">object</option>
                      <option value="array">array</option>
                    </select>
                    <input
                      v-model.trim="prop.description"
                      class="prop-input prop-desc"
                      type="text"
                      placeholder="Description (optional)"
                      :disabled="submitting"
                    />
                    <label class="prop-required-label" :title="'Mark as required'">
                      <input v-model="prop.required" type="checkbox" :disabled="submitting" />
                      <span>req</span>
                    </label>
                  </div>

                  <!-- Enum values for string type -->
                  <div v-if="prop.type === 'string'" class="enum-row">
                    <label class="inline-label">Enum values</label>
                    <input
                      v-model.trim="prop.enumRaw"
                      class="prop-input"
                      type="text"
                      placeholder="e.g. active, inactive, pending  (comma-separated)"
                      :disabled="submitting"
                    />
                  </div>

                  <button type="button" class="btn-remove-prop" :disabled="submitting" @click="removeProp(idx)">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <div v-else class="prop-empty">No properties defined yet.</div>

              <button type="button" class="btn-add-prop" :disabled="submitting" @click="addProp">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
                Add property
              </button>
            </div>

            <!-- Footer -->
            <div class="modal-footer">
              <button type="button" class="btn-cancel" :disabled="submitting" @click="close">Cancel</button>
              <button type="submit" class="btn-submit" :disabled="submitting || !form.request_name">
                <span v-if="submitting" class="spinner spinner--sm" />
                {{ submitting ? 'Saving…' : 'Create Template' }}
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
import { addTemplate } from '../../services/tasksService'
import { useToast } from '../../composables/useToast'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'created'): void
}>()

const toast = useToast()

interface PropRow {
  key: number
  name: string
  type: string
  description: string
  required: boolean
  enumRaw: string
}

let keyCounter = 0

const form = ref({ request_name: '', request_url: '', authentication_method: '' })
const properties = ref<PropRow[]>([])
const submitting = ref(false)
const jsonPreview = ref(false)

function addProp() {
  properties.value.push({ key: keyCounter++, name: '', type: 'string', description: '', required: false, enumRaw: '' })
}

function removeProp(idx: number) {
  properties.value.splice(idx, 1)
}

const schemaJson = computed(() => JSON.stringify(buildSchema(), null, 2))

function buildSchema(): Record<string, unknown> | null {
  if (!properties.value.length) return null
  const props: Record<string, unknown> = {}
  const required: string[] = []

  for (const p of properties.value) {
    if (!p.name) continue
    const def: Record<string, unknown> = { type: p.type }
    if (p.description) def.description = p.description
    if (p.type === 'string' && p.enumRaw.trim()) {
      def.enum = p.enumRaw.split(',').map((v) => v.trim()).filter(Boolean)
    }
    props[p.name] = def
    if (p.required) required.push(p.name)
  }

  if (!Object.keys(props).length) return null

  const schema: Record<string, unknown> = { type: 'object', properties: props }
  if (required.length) schema.required = required
  return schema
}

function resetForm() {
  form.value = { request_name: '', request_url: '', authentication_method: '' }
  properties.value = []
  jsonPreview.value = false
  submitting.value = false
}

function close() {
  if (submitting.value) return
  emit('update:modelValue', false)
}

async function submit() {
  if (!form.value.request_name) return
  submitting.value = true
  try {
    await addTemplate({
      request_name: form.value.request_name,
      request_url: form.value.request_url || null,
      authentication_method: form.value.authentication_method || null,
      request_schema: buildSchema(),
    })
    toast.success('Template created successfully.')
    emit('update:modelValue', false)
    emit('created')
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg ?? 'Failed to create template. Please try again.')
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => { if (open) resetForm() },
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
  max-width: 620px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  max-height: 92vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}
.modal-header h2 { font-size: 18px; font-weight: 700; color: #1a1f3c; margin: 0; }

.modal-close {
  background: transparent; border: none; color: #9ca3af;
  cursor: pointer; padding: 4px; border-radius: 6px;
  display: flex; transition: color 0.2s, background 0.2s;
}
.modal-close svg { width: 20px; height: 20px; }
.modal-close:hover { color: #374151; background: #f3f4f6; }

.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}

/* Section titles */
.section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #9ca3af;
  padding-bottom: 6px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-title--gap { margin-top: 8px; }

/* Fields */
.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 13px; font-weight: 600; color: #374151; }
.req { color: #ef4444; }

.field input, .field select {
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
.field input:focus, .field select:focus {
  border-color: #4f6ef7;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(79, 110, 247, 0.12);
}
.field input:disabled, .field select:disabled { opacity: 0.6; cursor: not-allowed; }

/* JSON preview */
.btn-toggle-json {
  font-size: 11px; font-weight: 600; color: #4f6ef7;
  background: #eff2ff; border: none; border-radius: 6px;
  padding: 3px 10px; cursor: pointer; transition: background 0.15s;
}
.btn-toggle-json:hover { background: #dde4fd; }

.json-preview {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: auto;
  max-height: 200px;
}
.json-preview pre {
  margin: 0;
  padding: 12px;
  font-size: 12px;
  font-family: 'Consolas', 'Menlo', monospace;
  color: #374151;
  white-space: pre;
}

/* Schema builder */
.schema-builder {
  background: #f9fafb;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schema-meta { }
.schema-type-row { display: flex; align-items: center; gap: 8px; }
.inline-label { font-size: 12px; font-weight: 600; color: #6b7280; }
.type-badge {
  font-size: 11px; font-weight: 700; color: #4f6ef7;
  background: #eff2ff; border-radius: 5px; padding: 2px 8px;
}

.prop-list { display: flex; flex-direction: column; gap: 10px; }

.prop-row {
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.prop-fields {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.prop-input {
  padding: 7px 10px;
  border: 1.5px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  background: #f9fafb;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s;
}
.prop-input:focus { border-color: #4f6ef7; background: #fff; }
.prop-name { flex: 1 1 140px; min-width: 120px; }
.prop-desc { flex: 2 1 180px; min-width: 140px; }

.prop-select {
  padding: 7px 28px 7px 10px;
  border: 1.5px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  background: #f9fafb url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 8px center;
  appearance: none;
  outline: none;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s;
  flex-shrink: 0;
}
.prop-select:focus { border-color: #4f6ef7; }

.prop-required-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
.prop-required-label input[type="checkbox"] { accent-color: #4f6ef7; }

.enum-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.enum-row .prop-input { flex: 1; }

.btn-remove-prop {
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  color: #d1d5db;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  transition: color 0.15s, background 0.15s;
}
.btn-remove-prop svg { width: 16px; height: 16px; }
.btn-remove-prop:hover:not(:disabled) { color: #ef4444; background: #fef2f2; }

.prop-empty {
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
  padding: 8px 0;
}

.btn-add-prop {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #4f6ef7;
  background: #eff2ff;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-add-prop svg { width: 15px; height: 15px; }
.btn-add-prop:hover:not(:disabled) { background: #dde4fd; }
.btn-add-prop:disabled { opacity: 0.5; cursor: not-allowed; }

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
  flex-shrink: 0;
  margin-top: 4px;
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
  width: 16px; height: 16px;
  border: 2px solid #e5e7eb;
  border-top-color: #4f6ef7;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
.spinner--sm {
  width: 14px; height: 14px;
  border-color: rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
}

@keyframes spin { to { transform: rotate(360deg); } }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.2s ease, opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: translateY(-16px); opacity: 0; }

@media (max-width: 480px) {
  .modal { border-radius: 12px; }
  .modal-body { padding: 14px 16px; }
  .modal-header { padding: 16px 16px 12px; }
  .prop-fields { flex-direction: column; align-items: stretch; }
  .prop-name, .prop-desc { min-width: 0; }
}
</style>
