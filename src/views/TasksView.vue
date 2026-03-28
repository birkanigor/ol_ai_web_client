<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Tasks</h1>
        <p class="page-subtitle">Monitor and manage all queued tasks</p>
      </div>
      <div class="header-actions">
        <button class="btn-refresh" :disabled="loading" @click="fetchTasks">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15" />
          </svg>
          Refresh
        </button>
        <button class="btn-new-task" @click="showModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Task
        </button>
      </div>
    </header>

    <NewTaskModal v-model="showModal" @created="fetchTasks" />

    <div class="page-body">
      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ filteredTasks.length }}</div>
          <div class="stat-label">{{ isFiltered ? 'Filtered' : 'Total' }}</div>
        </div>
        <div class="stat-card stat-card--yellow">
          <div class="stat-value">{{ countByStatus('queued') }}</div>
          <div class="stat-label">Queued</div>
        </div>
        <div class="stat-card stat-card--blue">
          <div class="stat-value">{{ countByStatus('running') }}</div>
          <div class="stat-label">Running</div>
        </div>
        <div class="stat-card stat-card--green">
          <div class="stat-value">{{ countByStatus('completed') }}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card stat-card--red">
          <div class="stat-value">{{ countByStatus('failed') }}</div>
          <div class="stat-label">Failed</div>
        </div>
      </div>

      <!-- Tasks table card -->
      <div class="card">
        <div class="card-header">
          <span>Task List</span>
          <span v-if="!loading && !fetchFailed" class="count-badge">
            {{ filteredTasks.length }}<template v-if="isFiltered"> / {{ tasks.length }}</template>
          </span>
          <button v-if="isFiltered" class="btn-clear-filters" @click="clearFilters">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            Clear filters
          </button>
        </div>

        <!-- Filter bar -->
        <div v-if="!loading && !fetchFailed" class="filter-bar">
          <div class="filter-group filter-group--wide">
            <label class="filter-label">Period</label>
            <ElDatePicker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="→"
              start-placeholder="Start date"
              end-placeholder="End date"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :clearable="true"
              class="ep-range-picker"
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">User</label>
            <select v-model="filters.userName" class="filter-input">
              <option value="">All users</option>
              <option v-for="u in userOptions" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Application</label>
            <select v-model="filters.appName" class="filter-input">
              <option value="">All apps</option>
              <option v-for="a in appOptions" :key="a" :value="a">{{ a }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Status</label>
            <select v-model="filters.status" class="filter-input">
              <option value="">All statuses</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-row">
          <span class="spinner" />
          <span>Loading tasks…</span>
        </div>

        <!-- Error -->
        <div v-else-if="fetchFailed" class="state-row state-row--error">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          Could not load tasks.
          <button class="retry-btn" @click="fetchTasks">Retry</button>
        </div>

        <!-- Table -->
        <div v-else class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Application</th>
                <th>Request</th>
                <th>User</th>
                <th>Status</th>
                <th>Requested At</th>
                <th>Completed At</th>
                <th>Last Action</th>
                <th>Payload</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredTasks.length === 0">
                <td colspan="10" class="empty-cell">
                  {{ isFiltered ? 'No tasks match the current filters.' : 'No tasks found.' }}
                </td>
              </tr>
              <tr v-for="task in pagedTasks" :key="task.id">
                <td class="muted id-cell">{{ task.id }}</td>
                <td><span class="app-badge">{{ task.application_name }}</span></td>
                <td class="bold">{{ task.request_name }}</td>
                <td class="muted">{{ task.user_name }}</td>
                <td>
                  <span class="status-pill" :class="`status-pill--${task.status_name}`">
                    <span class="status-dot" />
                    {{ task.status_name }}
                  </span>
                </td>
                <td class="muted nowrap">{{ task.request_time }}</td>
                <td class="muted nowrap">{{ task.completion_time ?? '—' }}</td>
                <td class="muted nowrap">{{ task.last_action_time ?? '—' }}</td>
                <td>
                  <button v-if="task.request_body" class="payload-btn" @click="togglePayload(task.id)">
                    {{ expandedPayloads.has(task.id) ? 'Hide' : 'View' }}
                  </button>
                  <span v-else class="muted">—</span>
                  <pre v-if="expandedPayloads.has(task.id)" class="payload-pre">{{ JSON.stringify(task.request_body, null, 2) }}</pre>
                </td>
                <td>
                  <span v-if="task.error" class="error-text" :title="task.error">{{ task.error }}</span>
                  <span v-else class="muted">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pagination
          v-if="!loading && !fetchFailed"
          v-model="currentPage"
          :total="filteredTasks.length"
          :page-size="pageSize"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElDatePicker } from 'element-plus'
import { getTasks, type TaskRecord } from '../services/tasksService'
import { useToast } from '../composables/useToast'
import NewTaskModal from '../components/tasks/NewTaskModal.vue'
import Pagination from '../components/common/Pagination.vue'

const PAGE_SIZE = Number(import.meta.env.VITE_PAGE_SIZE) || 5

const toast = useToast()

const tasks = ref<TaskRecord[]>([])
const loading = ref(false)
const fetchFailed = ref(false)
const expandedPayloads = ref<Set<number>>(new Set())
const showModal = ref(false)
const currentPage = ref(1)
const pageSize = PAGE_SIZE

async function fetchTasks() {
  loading.value = true
  fetchFailed.value = false
  try {
    tasks.value = await getTasks()
    currentPage.value = 1
  } catch {
    fetchFailed.value = true
    toast.error('Failed to load tasks. Please try again.')
  } finally {
    loading.value = false
  }
}

// Element Plus daterange returns ["YYYY-MM-DD", "YYYY-MM-DD"]
const filters = reactive({
  dateRange: null as [string, string] | null,
  userName: '',
  appName: '',
  status: '',
})

function clearFilters() {
  filters.dateRange = null
  filters.userName = ''
  filters.appName = ''
  filters.status = ''
  currentPage.value = 1
}

function taskDateOnly(s: string): string {
  return s.slice(0, 10)
}

const isFiltered = computed(() =>
  !!(filters.dateRange || filters.userName || filters.appName || filters.status),
)

const filteredTasks = computed(() => {
  let list = tasks.value
  if (filters.dateRange) {
    const [from, to] = filters.dateRange
    list = list.filter((t) => {
      const d = taskDateOnly(t.request_time)
      return d >= from && d <= to
    })
  }
  if (filters.userName) list = list.filter((t) => t.user_name === filters.userName)
  if (filters.appName)  list = list.filter((t) => t.application_name === filters.appName)
  if (filters.status)   list = list.filter((t) => t.status_name === filters.status)
  return list
})

const userOptions = computed(() => [...new Set(tasks.value.map((t) => t.user_name))].sort())
const appOptions  = computed(() => [...new Set(tasks.value.map((t) => t.application_name))].sort())

const pagedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredTasks.value.slice(start, start + pageSize)
})

// Reset to page 1 whenever filters change
watch(filters, () => { currentPage.value = 1 })

function countByStatus(status: string): number {
  return filteredTasks.value.filter((t) => t.status_name === status).length
}

function togglePayload(id: number) {
  const next = new Set(expandedPayloads.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedPayloads.value = next
}

onMounted(fetchTasks)
</script>

<style scoped>
.page {
  padding: 32px 24px;
  width: 100%;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}
.page-header h1 { font-size: 26px; font-weight: 700; color: #1a1f3c; margin: 0 0 4px; }
.page-subtitle   { color: #6b7280; font-size: 14px; margin: 0; }

.header-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; flex-wrap: wrap; }

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s, color 0.2s;
  flex-shrink: 0;
}
.btn-refresh svg { width: 15px; height: 15px; }
.btn-refresh:hover:not(:disabled) { border-color: #4f6ef7; color: #4f6ef7; }
.btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 0.8s linear infinite; }

.page-body { display: flex; flex-direction: column; gap: 20px; }

.stats-row { display: flex; gap: 14px; flex-wrap: wrap; }
.stat-card {
  flex: 1 1 100px;
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
  border-left: 4px solid #e5e7eb;
}
.stat-card--yellow { border-left-color: #f59e0b; }
.stat-card--blue   { border-left-color: #4f6ef7; }
.stat-card--green  { border-left-color: #10b981; }
.stat-card--red    { border-left-color: #ef4444; }
.stat-value { font-size: 28px; font-weight: 700; color: #1a1f3c; }
.stat-label { font-size: 12px; color: #6b7280; margin-top: 2px; }

.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
  overflow: hidden;
  width: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  font-weight: 600;
  color: #1a1f3c;
  font-size: 15px;
}

.count-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eff2ff;
  color: #4f6ef7;
}

.state-row { display: flex; align-items: center; gap: 10px; padding: 28px 24px; color: #6b7280; font-size: 14px; }
.state-row--error { color: #dc2626; }
.state-row--error svg { width: 16px; height: 16px; flex-shrink: 0; }

.retry-btn {
  margin-left: 8px;
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 600;
  border: 1.5px solid #dc2626;
  border-radius: 6px;
  background: transparent;
  color: #dc2626;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.retry-btn:hover { background: #dc2626; color: #fff; }

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

.table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 900px; }
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
.table td { padding: 13px 16px; color: #374151; border-bottom: 1px solid #f9fafb; vertical-align: top; }
.table tr:last-child td { border-bottom: none; }
.table tr:hover td { background: #f9fafb; }

.muted   { color: #9ca3af !important; font-size: 12px; }
.bold    { font-weight: 600; color: #1a1f3c; }
.nowrap  { white-space: nowrap; }
.id-cell { font-variant-numeric: tabular-nums; }

.empty-cell { text-align: center; color: #9ca3af; padding: 36px !important; }

.app-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 6px;
  background: #f3f4f6;
  color: #6b7280;
  white-space: nowrap;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
  color: #6b7280;
}
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #d1d5db; flex-shrink: 0; }
.status-pill--queued    .status-dot { background: #f59e0b; }
.status-pill--queued    { color: #b45309; }
.status-pill--running   .status-dot { background: #4f6ef7; }
.status-pill--running   { color: #3b56e0; }
.status-pill--completed .status-dot { background: #10b981; }
.status-pill--completed { color: #059669; }
.status-pill--failed    .status-dot { background: #ef4444; }
.status-pill--failed    { color: #dc2626; }

.payload-btn {
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 600;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  background: transparent;
  color: #4f6ef7;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.payload-btn:hover { background: #eff2ff; border-color: #4f6ef7; }

.payload-pre {
  margin-top: 8px;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 11px;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-all;
  max-width: 260px;
}

.error-text {
  font-size: 12px;
  color: #dc2626;
  max-width: 200px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
}

.btn-new-task {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  background: #4f6ef7;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}
.btn-new-task svg { width: 15px; height: 15px; }
.btn-new-task:hover { background: #3b56e0; }

/* Filter bar */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #f3f4f6;
  align-items: flex-end;
}
.filter-group { display: flex; flex-direction: column; gap: 4px; flex: 1 1 160px; min-width: 140px; }
.filter-group--wide { flex: 2 1 240px; }

.filter-label {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.filter-input {
  padding: 7px 10px;
  border: 1.5px solid #e5e7eb;
  border-radius: 7px;
  font-size: 13px;
  color: #374151;
  background: #fff;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}
.filter-input:focus { border-color: #4f6ef7; box-shadow: 0 0 0 3px rgba(79, 110, 247, 0.1); }

.ep-range-picker.el-date-editor {
  width: 100%;
  --el-color-primary: #4f6ef7;
  --el-border-radius-base: 7px;
}
.ep-range-picker :deep(.el-range-input) { font-size: 13px; font-family: inherit; }

:global(.el-date-range-picker__time-header) { display: none !important; }
:global(.el-date-picker__time-header)       { display: none !important; }

.btn-clear-filters {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  background: transparent;
  border: 1.5px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s, border-color 0.2s;
}
.btn-clear-filters svg { width: 12px; height: 12px; }
.btn-clear-filters:hover { color: #ef4444; border-color: #ef4444; }

@media (max-width: 480px) {
  .page { padding: 20px 16px; }
  .stat-value { font-size: 22px; }
}
</style>
