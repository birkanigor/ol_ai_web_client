<template>
  <div class="page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1>Automations</h1>
        <p class="page-subtitle">Monitor and manage automation rules</p>
      </div>
      <button class="btn-refresh" :disabled="loading" @click="fetchData">
        <svg viewBox="0 0 20 20" fill="currentColor" :class="{ spin: loading }">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
        Refresh
      </button>
    </header>

    <!-- Stat cards -->
    <StatCardsRow
      v-if="!loading && !fetchFailed"
      :cards="automationStatCards"
      :model-value="filterStatus"
      @update:model-value="val => { filterStatus = val; currentPage = 1 }"
    />

    <!-- Loading -->
    <div v-if="loading" class="state-row">
      <span class="spinner" />
      <span>Loading automations…</span>
    </div>

    <!-- Error -->
    <div v-else-if="fetchFailed" class="state-row state-row--error">
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      Failed to load automations.
      <button class="retry-btn" @click="fetchData">Retry</button>
    </div>

    <!-- Table -->
    <div v-else class="table-wrap">
      <!-- Toolbar -->
      <div class="table-toolbar">
        <div class="filters">
          <input
            v-model="filterName"
            class="filter-input"
            type="text"
            placeholder="Search by name…"
          />
          <select v-model="filterStatus" class="filter-select">
            <option value="">All statuses</option>
            <option v-for="s in allStatuses" :key="s.id" :value="s.status_name ?? ''">
              {{ capitalize(s.status_name) }}
            </option>
          </select>
          <select v-model="filterCategory" class="filter-select">
            <option value="">All categories</option>
            <option v-for="c in allCategories" :key="c.id" :value="c.category_name">
              {{ c.category_name }}
            </option>
          </select>
          <select v-model="filterSeverity" class="filter-select">
            <option value="">All severities</option>
            <option v-for="sv in allSeverities" :key="sv.id" :value="sv.severity_level_name ?? ''">
              {{ capitalize(sv.severity_level_name) }}
            </option>
          </select>
          <button v-if="isFiltered" class="btn-clear" @click="clearFilters">Clear</button>
        </div>
        <button class="btn-new" @click="showNewModal = true">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          New Rule
        </button>
      </div>

      <!-- Table -->
      <table class="table">
        <thead>
          <tr>
            <th class="th-sort" :class="thClass('id')"                   @click="sortBy('id')">#</th>
            <th class="th-sort" :class="thClass('rule_name')"            @click="sortBy('rule_name')">Rule Name</th>
            <th class="th-sort" :class="thClass('template_name')"        @click="sortBy('template_name')">Template</th>
            <th class="th-sort" :class="thClass('category_name')"        @click="sortBy('category_name')">Category</th>
            <th class="th-sort" :class="thClass('entity_name')"          @click="sortBy('entity_name')">Entity</th>
            <th class="th-sort" :class="thClass('severity_level_name')"  @click="sortBy('severity_level_name')">Severity</th>
            <th class="th-sort" :class="thClass('status_name')"          @click="sortBy('status_name')">Status</th>
            <th class="th-sort" :class="thClass('completion_intervals')" @click="sortBy('completion_intervals')">Intervals</th>
            <th class="th-sort" :class="thClass('user_name')"            @click="sortBy('user_name')">Created By</th>
            <th class="th-sort" :class="thClass('created_at')"           @click="sortBy('created_at')">Created</th>
            <th class="th-sort" :class="thClass('last_modified')"        @click="sortBy('last_modified')">Last Modified</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pagedRules.length === 0">
            <td colspan="11" class="empty-cell">
              {{ isFiltered ? 'No rules match the current filters.' : 'No automation rules found.' }}
            </td>
          </tr>
          <tr v-for="rule in pagedRules" :key="rule.id">
            <td class="muted id-cell">{{ rule.id }}</td>
            <td class="bold name-cell">{{ rule.rule_name ?? '—' }}</td>
            <td>
              <div v-if="rule.template_name" class="template-cell">
                <span class="template-name">{{ rule.template_name }}</span>
                <span v-if="rule.time_resolution" class="template-meta">{{ rule.time_resolution }}m</span>
              </div>
              <span v-else class="muted">—</span>
            </td>
            <td>
              <span v-if="rule.category_name" class="category-badge">{{ rule.category_name }}</span>
              <span v-else class="muted">—</span>
            </td>
            <td class="muted">{{ rule.entity_name ?? '—' }}</td>
            <td>
              <span
                v-if="rule.severity_level_name"
                class="severity-badge"
                :class="`severity-badge--${rule.severity_level_name}`"
              >{{ capitalize(rule.severity_level_name) }}</span>
              <span v-else class="muted">—</span>
            </td>
            <td>
              <span
                v-if="rule.status_name"
                class="status-pill"
                :class="`status-pill--${rule.status_name}`"
              >
                <span class="status-dot" />
                {{ capitalize(rule.status_name) }}
              </span>
              <span v-else class="muted">—</span>
            </td>
            <td class="muted center">{{ rule.completion_intervals }}</td>
            <td>
              <span v-if="rule.user_name" class="user-badge">
                <svg viewBox="0 0 20 20" fill="currentColor" class="user-icon">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
                {{ rule.user_name }}
              </span>
              <span v-else class="muted">—</span>
            </td>
            <td class="muted nowrap">{{ rule.created_at ?? '—' }}</td>
            <td class="muted nowrap">{{ rule.last_modified ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination
      v-if="!loading && !fetchFailed"
      v-model="currentPage"
      v-model:page-size="pageSize"
      :total="filteredRules.length"
    />

    <NewRuleModal
      v-if="showNewModal"
      @close="showNewModal = false"
      @created="fetchData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSortable } from '../composables/useSortable'
import {
  getRules, getRuleStatuses, getSeverityLevels, getTemplateCategories,
  type AutomationRule, type RuleStatus, type SeverityLevel, type TemplateCategory,
} from '../services/automationsService'
import { useToast } from '../composables/useToast'
import Pagination from '../components/common/Pagination.vue'
import StatCardsRow, { type StatCard } from '../components/common/StatCardsRow.vue'
import NewRuleModal from '../components/automations/NewRuleModal.vue'

const DEFAULT_PAGE_SIZE = Number(import.meta.env.VITE_PAGE_SIZE) || 10
const showNewModal = ref(false)

const toast       = useToast()
const rules       = ref<AutomationRule[]>([])
const allStatuses   = ref<RuleStatus[]>([])
const allSeverities = ref<SeverityLevel[]>([])
const allCategories = ref<TemplateCategory[]>([])
const loading       = ref(false)
const fetchFailed   = ref(false)
const currentPage   = ref(1)
const pageSize      = ref(DEFAULT_PAGE_SIZE)

const filterName     = ref('')
const filterStatus   = ref('')
const filterCategory = ref('')
const filterSeverity = ref('')

async function fetchData() {
  loading.value   = true
  fetchFailed.value = false
  try {
    const [rulesData, statusData, severityData, categoryData] = await Promise.all([
      getRules(),
      getRuleStatuses(),
      getSeverityLevels(),
      getTemplateCategories(),
    ])
    rules.value       = rulesData
    allStatuses.value   = statusData
    allSeverities.value = severityData
    allCategories.value = categoryData
    currentPage.value   = 1
  } catch {
    fetchFailed.value = true
    toast.error('Failed to load automations.')
  } finally {
    loading.value = false
  }
}

function capitalize(s: string | null | undefined): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function countByStatus(statusName: string | null): number {
  return rules.value.filter(r => r.status_name === statusName).length
}

function statusColor(statusName: string | null): StatCard['color'] {
  switch (statusName) {
    case 'active':      return 'green'
    case 'running':     return 'blue'
    case 'failed':      return 'red'
    case 'deactivated': return 'grey'
    default:            return undefined
  }
}

const automationStatCards = computed<StatCard[]>(() => [
  { value: filteredRules.value.length, label: isFiltered.value ? 'Filtered' : 'Total', filterValue: '' },
  ...allStatuses.value.map(s => ({
    value:       countByStatus(s.status_name),
    label:       capitalize(s.status_name),
    color:       statusColor(s.status_name),
    filterValue: s.status_name ?? '',
  })),
])

const isFiltered = computed(() =>
  !!(filterName.value || filterStatus.value || filterCategory.value || filterSeverity.value),
)

const filteredRules = computed(() => {
  let list = rules.value
  if (filterName.value)
    list = list.filter(r => (r.rule_name ?? '').toLowerCase().includes(filterName.value.toLowerCase()))
  if (filterStatus.value)
    list = list.filter(r => r.status_name === filterStatus.value)
  if (filterCategory.value)
    list = list.filter(r => r.category_name === filterCategory.value)
  if (filterSeverity.value)
    list = list.filter(r => r.severity_level_name === filterSeverity.value)
  return list
})

const { sortBy, applySorted, thClass } = useSortable()

const sortedRules = computed(() => applySorted(filteredRules.value))

const pagedRules = computed(() => {
  if (pageSize.value === 0) return sortedRules.value
  const start = (currentPage.value - 1) * pageSize.value
  return sortedRules.value.slice(start, start + pageSize.value)
})

function clearFilters() {
  filterName.value     = ''
  filterStatus.value   = ''
  filterCategory.value = ''
  filterSeverity.value = ''
  currentPage.value    = 1
}

onMounted(fetchData)
</script>

<style scoped>
.page {
  padding: 32px 24px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Header ── */
.page-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  flex-wrap: wrap;
}
.page-header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #1a1f3c; }
.page-subtitle { margin: 4px 0 0; font-size: 14px; color: #6b7280; }

.btn-new {
  display: inline-flex; align-items: center; gap: 6px;
  height: 36px; padding: 0 16px;
  background: #4f6ef7; color: #fff; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
  transition: background 0.15s;
}
.btn-new svg { width: 15px; height: 15px; }
.btn-new:hover { background: #3b56e0; }

.btn-refresh {
  display: inline-flex; align-items: center; gap: 7px;
  height: 36px; padding: 0 16px;
  background: #fff; border: 1.5px solid #e5e7eb; border-radius: 8px;
  font-size: 13px; font-weight: 600; color: #374151; cursor: pointer;
  transition: background 0.15s; white-space: nowrap;
}
.btn-refresh svg { width: 16px; height: 16px; }
.btn-refresh:hover:not(:disabled) { background: #f9fafb; }
.btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── State rows ── */
.state-row {
  display: flex; align-items: center; gap: 10px;
  padding: 28px 24px; color: #6b7280; font-size: 14px;
  background: #fff; border-radius: 12px;
}
.state-row--error { color: #dc2626; }
.state-row svg { width: 18px; height: 18px; flex-shrink: 0; }
.spinner {
  display: inline-block; width: 18px; height: 18px;
  border: 2px solid #e5e7eb; border-top-color: #4f6ef7;
  border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0;
}
.retry-btn {
  margin-left: 8px; padding: 4px 12px; font-size: 13px; font-weight: 600;
  border: 1.5px solid #dc2626; border-radius: 6px; background: transparent;
  color: #dc2626; cursor: pointer; transition: background 0.2s, color 0.2s;
}
.retry-btn:hover { background: #dc2626; color: #fff; }

/* ── Table container ── */
.table-wrap {
  background: #fff; border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07); overflow: hidden;
}

/* ── Toolbar ── */
.table-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 14px 20px; border-bottom: 1px solid #f3f4f6;
  flex-wrap: wrap;
}
.filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.filter-input, .filter-select {
  height: 34px; padding: 0 10px;
  border: 1.5px solid #e5e7eb; border-radius: 7px;
  font-size: 13px; color: #374151; outline: none;
  transition: border-color 0.15s; background: #fff;
}
.filter-input:focus, .filter-select:focus { border-color: #4f6ef7; }
.filter-input { min-width: 170px; }
.filter-select {
  appearance: none; cursor: pointer; padding-right: 28px; min-width: 140px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 8px center;
}
.btn-clear {
  height: 34px; padding: 0 12px; background: transparent;
  border: 1.5px solid #e5e7eb; border-radius: 7px;
  font-size: 13px; font-weight: 600; color: #6b7280; cursor: pointer;
  transition: background 0.15s;
}
.btn-clear:hover { background: #f9fafb; }

/* ── Table ── */
.table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 1100px; }
.table th {
  text-align: left; padding: 11px 14px;
  font-size: 11px; font-weight: 600; color: #9ca3af;
  text-transform: uppercase; letter-spacing: 0.5px;
  background: #fafafa; border-bottom: 1px solid #f3f4f6; white-space: nowrap;
}
.table td {
  padding: 12px 14px; color: #374151;
  border-bottom: 1px solid #f9fafb; white-space: nowrap;
}
.table tr:last-child td { border-bottom: none; }
.table tr:hover td { background: #f9fafb; }

.muted   { color: #9ca3af !important; font-size: 13px; }
.bold    { font-weight: 600; color: #1a1f3c; }
.nowrap  { white-space: nowrap; }
.id-cell { width: 48px; }
.center  { text-align: center; }
.name-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
.empty-cell { text-align: center; color: #9ca3af; padding: 32px !important; }

/* ── Template cell ── */
.template-cell { display: flex; align-items: center; gap: 6px; }
.template-name { font-size: 13px; color: #374151; }
.template-meta {
  font-size: 11px; color: #6b7280; background: #f3f4f6;
  border-radius: 4px; padding: 1px 6px; white-space: nowrap;
}

/* ── Category badge ── */
.category-badge {
  display: inline-block;
  font-size: 11px; font-weight: 600; color: #4f6ef7;
  background: #eff2ff; border-radius: 5px; padding: 2px 8px;
  white-space: nowrap;
}

/* ── Severity badge ── */
.severity-badge {
  display: inline-flex; align-items: center;
  font-size: 12px; font-weight: 600; border-radius: 5px;
  padding: 3px 8px; white-space: nowrap;
}
.severity-badge--warning  { background: #fffbeb; color: #d97706; }
.severity-badge--minor    { background: #eff6ff; color: #2563eb; }
.severity-badge--major    { background: #fff7ed; color: #ea580c; }
.severity-badge--critical { background: #fef2f2; color: #dc2626; }

/* ── Status pill ── */
.status-pill {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 500; text-transform: capitalize;
}
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #d1d5db; flex-shrink: 0; }
.status-pill--active      .status-dot { background: #10b981; }
.status-pill--active      { color: #059669; }
.status-pill--running     .status-dot { background: #3b82f6; }
.status-pill--running     { color: #2563eb; }
.status-pill--failed      .status-dot { background: #ef4444; }
.status-pill--failed      { color: #dc2626; }
.status-pill--deactivated .status-dot { background: #9ca3af; }
.status-pill--deactivated { color: #6b7280; }

/* ── User badge ── */
.user-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 500; color: #374151; white-space: nowrap;
}
.user-icon { width: 13px; height: 13px; color: #9ca3af; flex-shrink: 0; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.7s linear infinite; }

@media (max-width: 768px) {
  .page { padding: 20px 12px; }
  .table-toolbar { flex-direction: column; align-items: stretch; }
  .filters { flex-direction: column; align-items: stretch; }
  .filter-input, .filter-select { width: 100%; }
}

/* ── Sortable column headers ── */
.th-sort { cursor: pointer; user-select: none; white-space: nowrap; }
.th-sort::after { content: ' ↕'; color: #d1d5db; font-size: 10px; }
.th-sort--asc::after  { content: ' ↑'; color: #4f6ef7; }
.th-sort--desc::after { content: ' ↓'; color: #4f6ef7; }
.th-sort:hover { color: #374151; }
</style>
