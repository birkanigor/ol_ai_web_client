<template>
  <div class="panel">
    <!-- Toolbar -->
    <div class="panel-toolbar">
      <input
        v-model="filterName"
        class="filter-input"
        type="text"
        placeholder="Search by name…"
      />
      <button class="btn-new" @click="showModal = true">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        New Template
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-row">
      <span class="spinner" />
      <span>Loading templates…</span>
    </div>

    <!-- Error -->
    <div v-else-if="fetchFailed" class="state-row state-row--error">
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      Failed to load templates.
      <button class="retry-btn" @click="fetchTemplates">Retry</button>
    </div>

    <!-- Table -->
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th class="th-sort" :class="thClass('id')"          @click="sortBy('id')">#</th>
            <th class="th-sort" :class="thClass('request_name')" @click="sortBy('request_name')">Name</th>
            <th class="th-sort" :class="thClass('request_url')"  @click="sortBy('request_url')">URL</th>
            <th class="th-sort" :class="thClass('authentication_method')" @click="sortBy('authentication_method')">Auth</th>
            <th>Schema</th>
            <th>Properties</th>
            <th class="th-actions"></th>
          </tr>
        </thead>
        <tbody>
          <template v-if="sorted.length">
            <template v-for="tpl in sorted" :key="tpl.id">
              <tr class="table-row" :class="{ 'table-row--open': expanded === tpl.id }" @click="toggleExpand(tpl.id)">
                <td class="id-cell muted">{{ tpl.id }}</td>
                <td class="bold">{{ tpl.request_name }}</td>
                <td>
                  <span v-if="tpl.request_url" class="url-cell" :title="tpl.request_url">{{ tpl.request_url }}</span>
                  <span v-else class="muted">—</span>
                </td>
                <td>
                  <span v-if="tpl.authentication_method" class="auth-badge">
                    {{ tpl.authentication_method }}
                  </span>
                  <span v-else class="muted">None</span>
                </td>
                <td>
                  <span v-if="tpl.request_schema" class="schema-badge">JSON</span>
                  <span v-else class="muted">—</span>
                </td>
                <td class="muted">
                  {{ propertyCount(tpl) }}
                </td>
                <td class="actions-cell" @click.stop>
                  <button class="btn-edit" title="Edit template" @click="openEdit(tpl)">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </td>
              </tr>
              <!-- Expanded detail row -->
              <tr v-if="expanded === tpl.id" class="detail-row">
                <td colspan="7">
                  <div class="detail-panel">
                    <div class="detail-grid">
                      <div class="detail-item">
                        <span class="detail-label">Template ID</span>
                        <span class="detail-value">#{{ tpl.id }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Request URL</span>
                        <span class="detail-value">{{ tpl.request_url || '—' }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Authentication</span>
                        <span class="detail-value">{{ tpl.authentication_method || 'None' }}</span>
                      </div>
                    </div>

                    <div v-if="tpl.request_schema" class="schema-section">
                      <div class="schema-section-title">Schema properties</div>
                      <div class="props-grid">
                        <template v-if="schemaProperties(tpl).length">
                          <div v-for="p in schemaProperties(tpl)" :key="p.name" class="prop-chip">
                            <span class="prop-chip-name">{{ p.name }}</span>
                            <span class="prop-chip-type">{{ p.type }}</span>
                            <span v-if="p.required" class="prop-chip-req">req</span>
                            <span v-if="p.enum" class="prop-chip-enum" :title="p.enum.join(', ')">
                              enum({{ p.enum.length }})
                            </span>
                          </div>
                        </template>
                        <span v-else class="muted">No properties</span>
                      </div>

                      <div class="json-toggle-row">
                        <button class="btn-show-json" @click="toggleJson(tpl.id)">
                          {{ jsonOpen === tpl.id ? 'Hide JSON' : 'Show raw JSON' }}
                        </button>
                      </div>
                      <div v-if="jsonOpen === tpl.id" class="raw-json">
                        <pre>{{ JSON.stringify(tpl.request_schema, null, 2) }}</pre>
                      </div>
                    </div>
                    <div v-else class="muted schema-empty">No schema defined for this template.</div>
                  </div>
                </td>
              </tr>
            </template>
          </template>
          <tr v-else>
            <td colspan="7" class="empty-cell">
              {{ filterName ? 'No templates match the search.' : 'No templates yet. Create one to get started.' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AddTemplateModal v-model="showModal" @created="fetchTemplates" />
    <EditTemplateModal
      v-if="editTemplate"
      v-model="showEditModal"
      :template="editTemplate"
      @updated="fetchTemplates"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getTaskTemplates, type TaskTemplate, type TaskTemplateSchema } from '../../services/tasksService'
import AddTemplateModal from './AddTemplateModal.vue'
import EditTemplateModal from './EditTemplateModal.vue'

const loading = ref(false)
const fetchFailed = ref(false)
const templates = ref<TaskTemplate[]>([])
const filterName = ref('')
const showModal = ref(false)
const showEditModal = ref(false)
const editTemplate = ref<TaskTemplate | null>(null)
const expanded = ref<number | null>(null)
const jsonOpen = ref<number | null>(null)

function openEdit(tpl: TaskTemplate) {
  editTemplate.value = tpl
  showEditModal.value = true
}

type SortKey = 'id' | 'request_name' | 'request_url' | 'authentication_method'
const sortKey = ref<SortKey>('id')
const sortDir = ref<'asc' | 'desc'>('asc')

function sortBy(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function thClass(key: SortKey) {
  if (sortKey.value !== key) return {}
  return { 'th-sort--asc': sortDir.value === 'asc', 'th-sort--desc': sortDir.value === 'desc' }
}

const filtered = computed(() => {
  if (!filterName.value) return templates.value
  const q = filterName.value.toLowerCase()
  return templates.value.filter((t) => t.request_name.toLowerCase().includes(q))
})

const sorted = computed(() => {
  return [...filtered.value].sort((a, b) => {
    const aVal = String(a[sortKey.value] ?? '')
    const bVal = String(b[sortKey.value] ?? '')
    const cmp = sortKey.value === 'id'
      ? Number(a.id) - Number(b.id)
      : aVal.localeCompare(bVal)
    return sortDir.value === 'asc' ? cmp : -cmp
  })
})

function toggleExpand(id: number) {
  expanded.value = expanded.value === id ? null : id
  if (expanded.value !== id) jsonOpen.value = null
}

function toggleJson(id: number) {
  jsonOpen.value = jsonOpen.value === id ? null : id
}

function propertyCount(tpl: TaskTemplate): string {
  const schema = tpl.request_schema as TaskTemplateSchema | null
  if (!schema?.properties) return '—'
  const count = Object.keys(schema.properties).length
  return `${count} prop${count !== 1 ? 's' : ''}`
}

interface SchemaProp {
  name: string
  type: string
  required: boolean
  enum?: (string | number)[]
}

function schemaProperties(tpl: TaskTemplate): SchemaProp[] {
  const schema = tpl.request_schema as TaskTemplateSchema | null
  if (!schema?.properties) return []
  const required = schema.required ?? []
  return Object.entries(schema.properties).map(([name, def]) => ({
    name,
    type: (def as { type?: string }).type ?? 'any',
    required: required.includes(name),
    enum: (def as { enum?: (string | number)[] }).enum,
  }))
}

async function fetchTemplates() {
  loading.value = true
  fetchFailed.value = false
  try {
    templates.value = await getTaskTemplates()
    expanded.value = null
    jsonOpen.value = null
  } catch {
    fetchFailed.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchTemplates)
</script>

<style scoped>
.panel {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
  overflow: hidden;
}

/* ── Toolbar ── */
.panel-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #f3f4f6;
  flex-wrap: wrap;
}

.filter-input {
  height: 34px;
  padding: 0 10px;
  border: 1.5px solid #e5e7eb;
  border-radius: 7px;
  font-size: 13px;
  color: #374151;
  outline: none;
  transition: border-color 0.15s;
  background: #fff;
  min-width: 200px;
}
.filter-input:focus { border-color: #4f6ef7; }

.btn-new {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 16px;
  background: #4f6ef7;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.btn-new svg { width: 15px; height: 15px; }
.btn-new:hover { background: #3b56e0; }

/* ── State rows ── */
.state-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 32px 24px;
  color: #6b7280;
  font-size: 14px;
}
.state-row--error { color: #dc2626; }
.state-row--error svg { width: 18px; height: 18px; flex-shrink: 0; }

.spinner {
  display: inline-block;
  width: 18px; height: 18px;
  border: 2px solid #e5e7eb;
  border-top-color: #4f6ef7;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }

.retry-btn {
  margin-left: 8px;
  padding: 4px 12px;
  font-size: 13px; font-weight: 600;
  border: 1.5px solid #dc2626;
  border-radius: 6px;
  background: transparent;
  color: #dc2626;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.retry-btn:hover { background: #dc2626; color: #fff; }

/* ── Table ── */
.table-wrap { width: 100%; overflow-x: auto; }

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 700px;
}

.table th {
  text-align: left;
  padding: 11px 16px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  background: #fafafa;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap;
}

.table td {
  padding: 13px 16px;
  color: #374151;
  border-bottom: 1px solid #f9fafb;
  vertical-align: middle;
}

.table-row { cursor: pointer; transition: background 0.12s; }
.table-row:hover td { background: #f5f7ff; }
.table-row--open td { background: #f5f7ff; }

.id-cell { font-variant-numeric: tabular-nums; }
.muted { color: #9ca3af !important; font-size: 12px; }
.bold { font-weight: 600; color: #1a1f3c; }

.url-cell {
  display: inline-block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
  font-size: 12px;
  color: #4f6ef7;
}

.auth-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 5px;
  background: #eff2ff;
  color: #4f6ef7;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.schema-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 5px;
  background: #ecfdf5;
  color: #059669;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 48px 24px !important;
  font-size: 14px;
}

/* ── Sort headers ── */
.th-sort { cursor: pointer; user-select: none; white-space: nowrap; }
.th-sort::after { content: ' ↕'; color: #d1d5db; font-size: 10px; }
.th-sort--asc::after  { content: ' ↑'; color: #4f6ef7; }
.th-sort--desc::after { content: ' ↓'; color: #4f6ef7; }
.th-sort:hover { color: #374151; }

.th-actions { width: 40px; }

.actions-cell { width: 40px; text-align: center; padding: 0 8px !important; }

.btn-edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
  background: transparent;
  border: 1.5px solid #e5e7eb;
  border-radius: 6px;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.btn-edit svg { width: 14px; height: 14px; }
.btn-edit:hover { color: #4f6ef7; border-color: #4f6ef7; background: #eff2ff; }

/* ── Detail / expanded row ── */
.detail-row td { padding: 0; border-bottom: 1px solid #f3f4f6; }

.detail-panel {
  padding: 20px 24px;
  background: #fafbff;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-grid {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9ca3af;
}
.detail-value {
  font-size: 13px;
  color: #1a1f3c;
  font-weight: 500;
  max-width: 280px;
  word-break: break-all;
}

/* ── Schema detail ── */
.schema-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.schema-section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
}

.schema-empty { font-size: 13px; }

.props-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.prop-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  font-size: 12px;
}

.prop-chip-name {
  font-weight: 700;
  color: #1a1f3c;
}
.prop-chip-type {
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 4px;
  padding: 1px 6px;
}
.prop-chip-req {
  font-size: 10px;
  font-weight: 700;
  color: #dc2626;
  background: #fef2f2;
  border-radius: 4px;
  padding: 1px 5px;
}
.prop-chip-enum {
  font-size: 10px;
  font-weight: 600;
  color: #4f6ef7;
  background: #eff2ff;
  border-radius: 4px;
  padding: 1px 5px;
  cursor: default;
}

.json-toggle-row { display: flex; }

.btn-show-json {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  background: transparent;
  border: 1.5px solid #e5e7eb;
  border-radius: 6px;
  padding: 4px 12px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.btn-show-json:hover { border-color: #4f6ef7; color: #4f6ef7; }

.raw-json {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: auto;
  max-height: 260px;
}
.raw-json pre {
  margin: 0;
  padding: 12px;
  font-size: 12px;
  font-family: 'Consolas', 'Menlo', monospace;
  color: #374151;
  white-space: pre;
}

@media (max-width: 600px) {
  .detail-panel { padding: 14px 16px; }
  .detail-grid { flex-direction: column; gap: 12px; }
}
</style>
