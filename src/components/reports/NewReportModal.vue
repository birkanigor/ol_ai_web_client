<template>
  <Teleport to="body">
    <div class="modal-backdrop" @mousedown.self="$emit('update:modelValue', false)">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">

        <!-- Header -->
        <div class="modal-header">
          <h2 id="modal-title">{{ modalTitle }}</h2>
          <button class="close-btn" aria-label="Close" @click="$emit('update:modelValue', false)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </button>
        </div>

        <!-- Body -->
        <form class="modal-body" @submit.prevent="handleSubmit">

          <!-- Row 1: Name + Format -->
          <div class="form-row">
            <div class="form-field form-field--grow">
              <label>Report Name <span class="req">*</span></label>
              <input v-model="form.report_name" type="text" placeholder="e.g. Daily Sales" required />
            </div>
            <div class="form-field form-field--sm">
              <label>Format <span class="req">*</span></label>
              <select v-model="form.result_format" required>
                <option value="CSV">CSV</option>
                <option value="XLSX">XLSX</option>
              </select>
            </div>
          </div>

          <!-- Row 2: Data Source + Status -->
          <div class="form-row">
            <div class="form-field form-field--grow">
              <label>Data Source</label>
              <select v-model="form.data_source_id">
                <option :value="null">— none —</option>
                <option v-for="ds in dataSources" :key="ds.id" :value="ds.id">
                  {{ ds.source_name ?? `Source #${ds.id}` }}
                </option>
              </select>
              <span v-if="loadingDs" class="hint">Loading…</span>
            </div>
            <div class="form-field form-field--sm">
              <label>Status</label>
              <select v-model="form.report_status_id">
                <option :value="1">Active</option>
                <option :value="4">Deactivated</option>
              </select>
            </div>
          </div>

          <!-- Query -->
          <div class="form-field">
            <label>SQL Query <span class="req">*</span></label>
            <textarea
              v-model="form.report_query"
              rows="5"
              placeholder="SELECT * FROM my_table WHERE ..."
              required
              spellcheck="false"
            />
          </div>

          <!-- ── Scheduler ── -->
          <fieldset class="fieldset">
            <legend>Schedule</legend>

            <div class="form-field">
              <label>Frequency</label>
              <select v-model="scheduleType">
                <option value="minutes">Every N minutes</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom cron</option>
              </select>
            </div>

            <!-- Every N minutes -->
            <div v-if="scheduleType === 'minutes'" class="form-row sched-row">
              <div class="form-field">
                <label>Every</label>
                <select v-model="sched.everyN">
                  <option v-for="n in [1,2,5,10,15,20,30]" :key="n" :value="n">{{ n }} min</option>
                </select>
              </div>
            </div>

            <!-- Hourly -->
            <div v-else-if="scheduleType === 'hourly'" class="form-row sched-row">
              <div class="form-field">
                <label>At minute</label>
                <input v-model.number="sched.minute" type="number" min="0" max="59" placeholder="0" />
              </div>
            </div>

            <!-- Daily -->
            <div v-else-if="scheduleType === 'daily'" class="form-row sched-row">
              <div class="form-field">
                <label>Hour</label>
                <input v-model.number="sched.hour" type="number" min="0" max="23" placeholder="8" />
              </div>
              <div class="form-field">
                <label>Minute</label>
                <input v-model.number="sched.minute" type="number" min="0" max="59" placeholder="0" />
              </div>
            </div>

            <!-- Weekly -->
            <div v-else-if="scheduleType === 'weekly'" class="form-row sched-row">
              <div class="form-field">
                <label>Day</label>
                <select v-model.number="sched.weekday">
                  <option :value="1">Monday</option>
                  <option :value="2">Tuesday</option>
                  <option :value="3">Wednesday</option>
                  <option :value="4">Thursday</option>
                  <option :value="5">Friday</option>
                  <option :value="6">Saturday</option>
                  <option :value="0">Sunday</option>
                </select>
              </div>
              <div class="form-field">
                <label>Hour</label>
                <input v-model.number="sched.hour" type="number" min="0" max="23" placeholder="8" />
              </div>
              <div class="form-field">
                <label>Minute</label>
                <input v-model.number="sched.minute" type="number" min="0" max="59" placeholder="0" />
              </div>
            </div>

            <!-- Monthly -->
            <div v-else-if="scheduleType === 'monthly'" class="form-row sched-row">
              <div class="form-field">
                <label>Day of month</label>
                <input v-model.number="sched.dayOfMonth" type="number" min="1" max="28" placeholder="1" />
              </div>
              <div class="form-field">
                <label>Hour</label>
                <input v-model.number="sched.hour" type="number" min="0" max="23" placeholder="8" />
              </div>
              <div class="form-field">
                <label>Minute</label>
                <input v-model.number="sched.minute" type="number" min="0" max="59" placeholder="0" />
              </div>
            </div>

            <!-- Custom -->
            <div v-else-if="scheduleType === 'custom'" class="form-field">
              <label>Cron expression <span class="req">*</span></label>
              <input
                v-model="sched.custom"
                type="text"
                placeholder="0 8 * * *"
                spellcheck="false"
              />
              <span class="hint">Format: <code>minute hour day month weekday</code></span>
            </div>

            <!-- Cron preview -->
            <div class="cron-preview">
              <span class="cron-preview__label">Cron expression:</span>
              <code class="cron-preview__value">{{ cronExpression }}</code>
              <span class="cron-preview__desc">{{ cronDescription }}</span>
            </div>
          </fieldset>

          <!-- ── Delivery List ── -->
          <fieldset class="fieldset">
            <legend>Delivery</legend>
            <div class="form-field">
              <label>Email addresses <span class="req">*</span></label>
              <div class="chip-input" :class="{ 'chip-input--focused': chipFocused }">
                <span v-for="(email, i) in emails" :key="i" class="chip">
                  {{ email }}
                  <button type="button" class="chip-remove" @click="removeEmail(i)">×</button>
                </span>
                <input
                  ref="chipInputRef"
                  v-model="emailDraft"
                  type="text"
                  placeholder="name@example.com — press Enter, comma or space"
                  @focus="chipFocused = true"
                  @blur="flushDraft(); chipFocused = false"
                  @keydown.enter.prevent="flushDraft"
                  @input="onDraftInput"
                  @keydown.backspace="onBackspace"
                />
              </div>
              <span v-if="emailError" class="hint hint--error">{{ emailError }}</span>
            </div>
          </fieldset>

          <!-- Footer -->
          <div class="modal-footer">
            <button type="button" class="btn btn--ghost" @click="$emit('update:modelValue', false)">
              Cancel
            </button>
            <button type="submit" class="btn btn--primary" :disabled="submitting">
              {{ submitting ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Report') }}
            </button>
          </div>

        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  getDataSources, addReport, updateReport,
  type DataSource, type ScheduledReport,
} from '../../services/reportsService'
import { useToast } from '../../composables/useToast'

const props = defineProps<{
  modelValue: boolean
  report?: ScheduledReport | null   // provided → edit mode
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'created'): void
}>()

const isEdit     = computed(() => !!props.report)
const modalTitle = computed(() => isEdit.value ? 'Edit Report' : 'New Report')

const toast = useToast()

// ── Scheduler (declared first so parseCron can mutate them) ───────────────
type ScheduleType = 'minutes' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'

const scheduleType = ref<ScheduleType>('daily')
const sched = reactive({
  everyN:     5,
  minute:     0,
  hour:       8,
  weekday:    1,
  dayOfMonth: 1,
  custom:     '0 8 * * *',
})

/** Parse a saved cron expression back into the schedule builder fields. */
function parseCron(cron: string) {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) { scheduleType.value = 'custom'; sched.custom = cron; return }
  const [m, h, dom, , dow] = parts
  if (/^\*\/\d+$/.test(m) && h === '*' && dom === '*') {
    scheduleType.value = 'minutes'; sched.everyN = parseInt(m.slice(2)); return
  }
  if (/^\d+$/.test(m) && h === '*' && dom === '*' && dow === '*') {
    scheduleType.value = 'hourly'; sched.minute = parseInt(m); return
  }
  if (/^\d+$/.test(m) && /^\d+$/.test(h) && dom === '*' && dow === '*') {
    scheduleType.value = 'daily'; sched.hour = parseInt(h); sched.minute = parseInt(m); return
  }
  if (/^\d+$/.test(m) && /^\d+$/.test(h) && dom === '*' && /^\d+$/.test(dow)) {
    scheduleType.value = 'weekly'; sched.hour = parseInt(h); sched.minute = parseInt(m); sched.weekday = parseInt(dow); return
  }
  if (/^\d+$/.test(m) && /^\d+$/.test(h) && /^\d+$/.test(dom) && dow === '*') {
    scheduleType.value = 'monthly'; sched.hour = parseInt(h); sched.minute = parseInt(m); sched.dayOfMonth = parseInt(dom); return
  }
  scheduleType.value = 'custom'; sched.custom = cron
}

// ── Form — initialised synchronously from props ───────────────────────────
const r = props.report
const form = reactive({
  report_name:      r?.report_name      ?? '',
  report_query:     r?.report_query     ?? '',
  data_source_id:   (r?.data_source_id  ?? null) as number | null,
  result_format:    (r?.result_format === 'XLSX' ? 'XLSX' : 'CSV') as 'CSV' | 'XLSX',
  report_status_id: (r?.report_status_id === 4 ? 4 : 1) as 1 | 4,
})

// ── Emails — initialised synchronously from props ─────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const emails = ref<string[]>(
  r?.delivery_list
    ? r.delivery_list.split(',').map(e => e.trim()).filter(Boolean)
    : []
)

// Parse cron synchronously if editing
if (r?.report_scheduler) parseCron(r.report_scheduler)

// ── Data sources — loaded async (form.data_source_id already set above) ──
const dataSources = ref<DataSource[]>([])
const loadingDs   = ref(false)

onMounted(async () => {
  loadingDs.value = true
  try {
    dataSources.value = await getDataSources()
  } catch {
    toast.error('Could not load data sources.')
  } finally {
    loadingDs.value = false
  }
})

const cronExpression = computed((): string => {
  const m  = sched.minute     ?? 0
  const h  = sched.hour       ?? 8
  const wd = sched.weekday    ?? 1
  const d  = sched.dayOfMonth ?? 1
  switch (scheduleType.value) {
    case 'minutes': return `*/${sched.everyN} * * * *`
    case 'hourly':  return `${m} * * * *`
    case 'daily':   return `${m} ${h} * * *`
    case 'weekly':  return `${m} ${h} * * ${wd}`
    case 'monthly': return `${m} ${h} ${d} * *`
    case 'custom':  return sched.custom || '0 8 * * *'
  }
})

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const cronDescription = computed((): string => {
  const m  = sched.minute     ?? 0
  const h  = sched.hour       ?? 8
  const wd = sched.weekday    ?? 1
  const d  = sched.dayOfMonth ?? 1
  const pad = (n: number) => String(n).padStart(2, '0')
  switch (scheduleType.value) {
    case 'minutes': return `Every ${sched.everyN} minute(s)`
    case 'hourly':  return `Every hour at :${pad(m)}`
    case 'daily':   return `Every day at ${pad(h)}:${pad(m)}`
    case 'weekly':  return `Every ${DAY_NAMES[wd]} at ${pad(h)}:${pad(m)}`
    case 'monthly': return `On day ${d} of every month at ${pad(h)}:${pad(m)}`
    case 'custom':  return 'Custom schedule'
  }
})

// ── Email chips ───────────────────────────────────────────────────────────
const emailDraft   = ref('')
const emailError   = ref('')
const chipFocused  = ref(false)
const chipInputRef = ref<HTMLInputElement | null>(null)

/** Try to add a single trimmed email string as a chip. Returns true on success. */
function tryAdd(raw: string): boolean {
  const addr = raw.trim()
  if (!addr) return true                   // empty → silently skip
  if (!EMAIL_RE.test(addr)) {
    emailError.value = `"${addr}" is not a valid email address`
    return false
  }
  if (!emails.value.includes(addr)) {
    emails.value.push(addr)
  }
  emailError.value = ''
  return true
}

/**
 * Called on every input event.
 * Splits on comma or space as soon as the user types one,
 * turning each completed token into a chip immediately.
 */
function onDraftInput() {
  const val = emailDraft.value
  // If the draft contains a delimiter, split and commit all but the tail
  if (/[,\s]/.test(val)) {
    const parts = val.split(/[,\s]+/)
    const tail  = parts.pop() ?? ''       // the part still being typed
    for (const part of parts) tryAdd(part)
    emailDraft.value = tail
  }
}

/** Flush whatever is left in the input as a chip (Enter / blur). */
function flushDraft() {
  const parts = emailDraft.value.split(/[,\s]+/).filter(Boolean)
  const invalid: string[] = []
  for (const part of parts) {
    if (!tryAdd(part)) invalid.push(part)
  }
  emailDraft.value = invalid.join(', ')
}

function removeEmail(i: number) {
  emails.value.splice(i, 1)
}

function onBackspace() {
  if (emailDraft.value === '' && emails.value.length) {
    emails.value.pop()
  }
}

// ── Submit ─────────────────────────────────────────────────────────────────
const submitting = ref(false)

async function handleSubmit() {
  // Commit any pending email draft
  if (emailDraft.value.trim()) flushDraft()
  if (emails.value.length === 0) {
    emailError.value = 'At least one delivery email is required'
    return
  }
  if (emailError.value) return

  submitting.value = true
  const payload = {
    report_name:      form.report_name,
    report_query:     form.report_query,
    data_source_id:   form.data_source_id ?? undefined,
    result_format:    form.result_format,
    report_scheduler: cronExpression.value,
    delivery_list:    emails.value.join(','),
    report_status_id: form.report_status_id,
  }
  try {
    if (isEdit.value && props.report) {
      await updateReport({ ...payload, report_id: props.report.id })
      toast.success('Report updated successfully.')
    } else {
      await addReport(payload)
      toast.success('Report created successfully.')
    }
    emit('created')
    emit('update:modelValue', false)
  } catch {
    toast.error(isEdit.value ? 'Failed to update report.' : 'Failed to create report.')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* ── Backdrop & modal shell ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal {
  background: #fff;
  border-radius: 14px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}

/* ── Header ── */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-header h2 { font-size: 18px; font-weight: 700; color: #111827; margin: 0; }

.close-btn {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; border-radius: 6px;
  cursor: pointer; color: #6b7280;
}
.close-btn:hover { background: #f3f4f6; color: #374151; }
.close-btn svg { width: 18px; height: 18px; }

/* ── Body ── */
.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Form fields ── */
.form-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 140px;
}
.form-field--grow { flex: 2; }
.form-field--sm   { flex: 1; min-width: 110px; max-width: 160px; }

.form-field label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: .4px;
}
.req { color: #ef4444; }

.form-field input,
.form-field select,
.form-field textarea {
  padding: 8px 11px;
  border: 1.5px solid #d1d5db;
  border-radius: 7px;
  font-size: 13px;
  font-family: inherit;
  color: #111827;
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus { border-color: #4f6ef7; }
.form-field textarea { resize: vertical; font-family: 'Courier New', monospace; font-size: 12px; }

.hint { font-size: 11px; color: #9ca3af; }
.hint code { font-family: monospace; background: #f3f4f6; padding: 1px 4px; border-radius: 3px; }
.hint--error { color: #dc2626; }

/* ── Fieldset sections ── */
.fieldset {
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 16px 16px;
  margin: 0;
}
.fieldset legend {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: #6b7280;
  padding: 0 6px;
}
.sched-row { margin-top: 4px; }

/* ── Cron preview ── */
.cron-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  flex-wrap: wrap;
}
.cron-preview__label { font-size: 11px; color: #6b7280; font-weight: 600; }
.cron-preview__value {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: 700;
  color: #4f6ef7;
  background: #eff2ff;
  padding: 2px 8px;
  border-radius: 5px;
}
.cron-preview__desc { font-size: 12px; color: #374151; margin-left: 4px; }

/* ── Email chip input ── */
.chip-input {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 7px 10px;
  border: 1.5px solid #d1d5db;
  border-radius: 7px;
  background: #fff;
  min-height: 40px;
  cursor: text;
  transition: border-color 0.15s;
}
.chip-input--focused { border-color: #4f6ef7; }

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #eff2ff;
  color: #3730a3;
  border: 1px solid #c7d2fe;
  border-radius: 12px;
  font-size: 12px;
  padding: 2px 8px;
  white-space: nowrap;
}
.chip-remove {
  background: none; border: none; cursor: pointer;
  color: #6366f1; font-size: 14px; line-height: 1;
  padding: 0 1px;
}
.chip-remove:hover { color: #dc2626; }

.chip-input input {
  border: none; outline: none; flex: 1; min-width: 180px;
  font-size: 13px; font-family: inherit; color: #111827;
  background: transparent; padding: 2px 0;
}

/* ── Footer ── */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
  margin-top: 4px;
}

.btn {
  padding: 9px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.15s, opacity 0.15s;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn--ghost   { background: #f3f4f6; color: #374151; }
.btn--ghost:hover:not(:disabled)   { background: #e5e7eb; }
.btn--primary { background: #4f6ef7; color: #fff; }
.btn--primary:hover:not(:disabled) { background: #3b56e0; }
</style>
