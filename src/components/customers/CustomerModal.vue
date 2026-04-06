<template>
  <Teleport to="body">
    <div class="modal-backdrop" @mousedown.self="$emit('update:modelValue', false)">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="cust-modal-title">
        <div class="modal-header">
          <h2 id="cust-modal-title">{{ isEdit ? 'Edit Customer' : 'New Customer' }}</h2>
          <button class="close-btn" aria-label="Close" @click="$emit('update:modelValue', false)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form class="modal-body" @submit.prevent="handleSubmit">
          <div class="form-grid">
            <!-- Name -->
            <div class="form-group form-group--full">
              <label class="form-label">Customer Name <span class="req">*</span></label>
              <input v-model="form.customer_name" class="form-input" type="text" placeholder="e.g. Acme Corp" required />
            </div>

            <!-- Description -->
            <div class="form-group form-group--full">
              <label class="form-label">Description</label>
              <input v-model="form.customer_description" class="form-input" type="text" placeholder="Short description" />
            </div>

            <!-- Reference ID -->
            <div class="form-group">
              <label class="form-label">Reference ID</label>
              <input v-model="form.reference_id" class="form-input" type="text" placeholder="External reference" />
            </div>

            <!-- Status -->
            <div class="form-group">
              <label class="form-label">Status</label>
              <select v-model="form.customer_status_id" class="form-input form-select">
                <option :value="1">Active</option>
                <option :value="2">Deactivated</option>
                <option :value="3">Suspended</option>
                <option :value="4">Deleted</option>
              </select>
            </div>

            <!-- Billing Address -->
            <div class="form-group form-group--full">
              <label class="form-label">Billing Address</label>
              <input v-model="form.billing_address" class="form-input" type="text" placeholder="Street, City, Country" />
            </div>

            <!-- Additional Config (JSON) -->
            <div class="form-group form-group--full">
              <label class="form-label">Additional Config <span class="hint">(JSON)</span></label>
              <textarea
                v-model="configRaw"
                class="form-input form-textarea"
                placeholder='{"key": "value"}'
                rows="4"
                spellcheck="false"
                @blur="validateJson"
              />
              <span v-if="jsonError" class="field-error">{{ jsonError }}</span>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn--ghost" @click="$emit('update:modelValue', false)">Cancel</button>
            <button type="submit" class="btn btn--primary" :disabled="submitting || !!jsonError">
              <svg v-if="submitting" class="spin" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
              </svg>
              {{ submitting ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Add Customer') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { addCustomer, updateCustomer, type Customer } from '../../services/customersService'
import { useToast } from '../../composables/useToast'

const props = defineProps<{
  modelValue: boolean
  customer?: Customer | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved'): void
}>()

const isEdit = computed(() => !!props.customer)
const toast  = useToast()

const c = props.customer
const form = reactive({
  customer_name:        c?.customer_name        ?? '',
  customer_description: c?.customer_description ?? '',
  reference_id:         c?.reference_id         ?? '',
  billing_address:      c?.billing_address      ?? '',
  customer_status_id:   (c?.customer_status_id  ?? 1) as 1 | 2 | 3 | 4,
})

const configRaw  = ref(c?.additional_config ? JSON.stringify(c.additional_config, null, 2) : '')
const jsonError  = ref('')
const submitting = ref(false)

function validateJson() {
  const raw = configRaw.value.trim()
  if (!raw) { jsonError.value = ''; return }
  try { JSON.parse(raw); jsonError.value = '' } catch { jsonError.value = 'Invalid JSON' }
}

async function handleSubmit() {
  validateJson()
  if (jsonError.value) return

  submitting.value = true
  const additionalConfig = configRaw.value.trim()
    ? JSON.parse(configRaw.value) as Record<string, unknown>
    : null

  const payload = {
    customer_name:        form.customer_name,
    customer_description: form.customer_description || null,
    reference_id:         form.reference_id         || null,
    billing_address:      form.billing_address       || null,
    customer_status_id:   form.customer_status_id,
    additional_config:    additionalConfig,
  }

  try {
    if (isEdit.value && props.customer) {
      await updateCustomer({ ...payload, id: props.customer.id })
      toast.success(`Customer "${form.customer_name}" updated.`)
    } else {
      await addCustomer(payload)
      toast.success(`Customer "${form.customer_name}" created.`)
    }
    emit('saved')
    emit('update:modelValue', false)
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg ?? (isEdit.value ? 'Failed to update customer.' : 'Failed to create customer.'))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  width: 100%;
  max-width: 580px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}
.modal-header h2 { margin: 0; font-size: 17px; font-weight: 700; color: #1a1f3c; }

.close-btn {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; border-radius: 6px; cursor: pointer;
  color: #9ca3af; transition: background 0.15s, color 0.15s;
}
.close-btn svg { width: 18px; height: 18px; }
.close-btn:hover { background: #f3f4f6; color: #374151; }

.modal-body { padding: 20px 24px 0; display: flex; flex-direction: column; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group--full { grid-column: 1 / -1; }

.form-label { font-size: 13px; font-weight: 600; color: #374151; }
.req { color: #ef4444; margin-left: 2px; }
.hint { font-weight: 400; color: #9ca3af; margin-left: 4px; font-size: 12px; }

.form-input {
  height: 38px; padding: 0 12px;
  border: 1.5px solid #e5e7eb; border-radius: 8px;
  font-size: 14px; color: #1a1f3c; background: #fff;
  transition: border-color 0.15s; outline: none;
  width: 100%; box-sizing: border-box;
}
.form-input:focus { border-color: #4f6ef7; }

.form-textarea {
  height: auto; padding: 10px 12px;
  resize: vertical; font-family: 'Menlo', 'Consolas', monospace; font-size: 13px;
  line-height: 1.5;
}

.form-select {
  appearance: none; cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center; padding-right: 32px;
}

.field-error { font-size: 12px; color: #dc2626; margin-top: 2px; }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 20px 0 24px; margin-top: 20px; border-top: 1px solid #f3f4f6;
}

.btn {
  height: 38px; padding: 0 20px; border-radius: 8px;
  font-size: 14px; font-weight: 600; cursor: pointer; border: none;
  display: inline-flex; align-items: center; gap: 7px;
  transition: background 0.15s, opacity 0.15s;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn--primary { background: #4f6ef7; color: #fff; }
.btn--primary:hover:not(:disabled) { background: #3b56e0; }
.btn--ghost { background: transparent; color: #6b7280; border: 1.5px solid #e5e7eb; }
.btn--ghost:hover { background: #f9fafb; }

.spin { width: 16px; height: 16px; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 540px) { .form-grid { grid-template-columns: 1fr; } }
</style>
