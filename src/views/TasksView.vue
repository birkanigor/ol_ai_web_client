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
        <div
          class="stat-card stat-card--clickable"
          :class="{ 'stat-card--active': filters.status === '' }"
          title="Show all"
          @click="setStatusFilter('')"
        >
          <div class="stat-value">{{ filteredTasks.length }}</div>
          <div class="stat-label">{{ isFiltered ? 'Filtered' : 'Total' }}</div>
        </div>
        <div
          class="stat-card stat-card--yellow stat-card--clickable"
          :class="{ 'stat-card--active': filters.status === 'queued' }"
          title="Filter by Queued"
          @click="setStatusFilter('queued')"
        >
          <div class="stat-value">{{ countByStatus('queued') }}</div>
          <div class="stat-label">Queued</div>
        </div>
        <div
          class="stat-card stat-card--blue stat-card--clickable"
          :class="{ 'stat-card--active': filters.status === 'running' }"
          title="Filter by Running"
          @click="setStatusFilter('running')"
        >
          <div class="stat-value">{{ countByStatus('running') }}</div>
          <div class="stat-label">Running</div>
        </div>
        <div
          class="stat-card stat-card--green stat-card--clickable"
          :class="{ 'stat-card--active': filters.status === 'completed' }"
          title="Filter by Completed"
          @click="setStatusFilter('completed')"
        >
          <div class="stat-value">{{ countByStatus('completed') }}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div
          class="stat-card stat-card--red stat-card--clickable"
          :class="{ 'stat-card--active': filters.status === 'failed' }"
          title="Filter by Failed"
          @click="setStatusFilter('failed')"
        >
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
              :shortcuts="dateShortcuts"
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
                <th>Response</th>
                <th>Error</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredTasks.length === 0">
                <td colspan="12" class="empty-cell">
                  {{ isFiltered ? 'No tasks match the current filters.' : 'No tasks found.' }}
                </td>
              </tr>
              <tr v-for="task in pagedTasks" :key="task.id">
                <td class="muted id-cell">{{ task.id }}</td>
                <td><span class="app-badge">{{ task.application_name }}</span></td>
                <td class="bold">{{ task.request_name }}</td>
                <td class="muted">{{ task.user_name }}</td>
                <td>
                  <span class="status-pill" :class="`status-pill--${normalizeStatus(task.status_name)}`">
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
                  <button v-if="task.response" class="payload-btn" @click="toggleResponse(task.id)">
                    {{ expandedResponses.has(task.id) ? 'Hide' : 'View' }}
                  </button>
                  <span v-else class="muted">—</span>
                  <pre v-if="expandedResponses.has(task.id)" class="payload-pre">{{ JSON.stringify(task.response, null, 2) }}</pre>
                </td>
                <td>
                  <span v-if="task.error" class="error-text" :title="task.error">{{ task.error }}</span>
                  <span v-else class="muted">—</span>
                </td>
                <td class="actions-cell">
                  <button
                    class="icon-btn icon-btn--resend"
                    :class="{ 'icon-btn--loading': resendingId === task.id }"
                    :disabled="resendingId !== null"
                    title="Resend task"
                    @click="handleResend(task)"
                  >
                    <svg v-if="resendingId !== task.id" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                    </svg>
                    <svg v-else class="spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pagination
          v-if="!loading && !fetchFailed"
          v-model="currentPage"
          v-model:page-size="pageSize"
          :total="filteredTasks.length"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElDatePicker } from 'element-plus'
import { getTasks, getTaskById, resendTask, type TaskRecord } from '../services/tasksService'
import { getToken, getSessionId } from '../services/authService'
import { useToast } from '../composables/useToast'
import NewTaskModal from '../components/tasks/NewTaskModal.vue'
import Pagination from '../components/common/Pagination.vue'
import { API_BASE_URL } from '../config/api'

const DEFAULT_PAGE_SIZE = Number(import.meta.env.VITE_PAGE_SIZE) || 5

const toast = useToast()

const tasks = ref<TaskRecord[]>([])
const loading = ref(false)
const fetchFailed = ref(false)
const expandedPayloads = ref<Set<number>>(new Set())
const expandedResponses = ref<Set<number>>(new Set())
const resendingId = ref<number | null>(null)
const showModal = ref(false)
const currentPage = ref(1)
const pageSize = ref(DEFAULT_PAGE_SIZE)

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
function defaultDateRange(): [string, string] {
  const to   = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return [fmt(from), fmt(to)]
}

const dateShortcuts = [
  {
    text: 'Last 7 days',
    value(): [Date, Date] {
      const end   = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return [start, end]
    },
  },
  {
    text: 'Last 30 days',
    value(): [Date, Date] {
      const end   = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      return [start, end]
    },
  },
  {
    text: 'Last month',
    value(): [Date, Date] {
      const end   = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 1)
      start.setDate(1)
      end.setDate(0) // last day of previous month
      return [start, end]
    },
  },
  {
    text: 'Last year',
    value(): [Date, Date] {
      const end   = new Date()
      const start = new Date()
      start.setFullYear(start.getFullYear() - 1)
      start.setMonth(0, 1)
      end.setMonth(11, 31)
      return [start, end]
    },
  },
]

const filters = reactive({
  dateRange: defaultDateRange() as [string, string] | null,
  userName: '',
  appName: '',
  status: '',
})

function clearFilters() {
  filters.dateRange = defaultDateRange()
  filters.userName = ''
  filters.appName = ''
  filters.status = ''
  currentPage.value = 1
}

function setStatusFilter(status: string) {
  // clicking the already-active card toggles it off
  filters.status = filters.status === status ? '' : status
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
  if (filters.status)   list = list.filter((t) => normalizeStatus(t.status_name) === filters.status)
  return list
})

const userOptions = computed(() => [...new Set(tasks.value.map((t) => t.user_name))].sort())
const appOptions  = computed(() => [...new Set(tasks.value.map((t) => t.application_name))].sort())

const pagedTasks = computed(() => {
  if (pageSize.value === 0) return filteredTasks.value
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTasks.value.slice(start, start + pageSize.value)
})

// Reset to page 1 whenever filters or page size change
watch(filters, () => { currentPage.value = 1 })
watch(pageSize, () => { currentPage.value = 1 })

/** Normalise DB status strings to the canonical CSS/filter names. */
function normalizeStatus(raw: string | null | undefined): string {
  const s = (raw ?? '').toLowerCase()
  if (s === 'fail' || s === 'error') return 'failed'
  return s
}

function countByStatus(status: string): number {
  return filteredTasks.value.filter((t) => normalizeStatus(t.status_name) === status).length
}

function togglePayload(id: number) {
  const next = new Set(expandedPayloads.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedPayloads.value = next
}

function toggleResponse(id: number) {
  const next = new Set(expandedResponses.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedResponses.value = next
}

async function handleResend(task: TaskRecord) {
  if (resendingId.value !== null) return
  resendingId.value = task.id
  try {
    await resendTask(task.id)
    toast.success(`Task #${task.id} queued for resend.`)
    await fetchTasks()
  } catch {
    toast.error(`Failed to resend task #${task.id}.`)
  } finally {
    resendingId.value = null
  }
}

// ── Server-Sent Events for live table refresh ─────────────────────────────
let sse: EventSource | null = null

function connectSse() {
  const token     = getToken()
  const sessionId = getSessionId()
  if (!token || !sessionId) return

  const url = `${API_BASE_URL}/api/events/tasks?token=${encodeURIComponent(token)}&sessionId=${encodeURIComponent(sessionId)}`
  sse = new EventSource(url)

  sse.onmessage = async (event: MessageEvent) => {
    try {
      const { taskId } = JSON.parse(event.data) as { taskId: number }
      const updated = await getTaskById(taskId)
      if (!updated) return

      const idx = tasks.value.findIndex(t => t.id === taskId)
      if (idx !== -1) {
        // Patch only the fields that the server can change
        Object.assign(tasks.value[idx], updated)
      } else {
        // New task not yet in the list — add at the top
        tasks.value.unshift(updated)
      }
    } catch {
      // Fallback: full reload if message is malformed
      fetchTasks()
    }
  }

  sse.onerror = () => {
    // EventSource auto-reconnects; nothing extra needed
  }
}

function disconnectSse() {
  if (sse) {
    sse.close()
    sse = null
  }
}

onMounted(() => {
  fetchTasks()
  connectSse()
})

onBeforeUnmount(disconnectSse)
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
  transition: box-shadow 0.15s, transform 0.15s, background 0.15s;
}
.stat-card--yellow { border-left-color: #f59e0b; }
.stat-card--blue   { border-left-color: #4f6ef7; }
.stat-card--green  { border-left-color: #10b981; }
.stat-card--red    { border-left-color: #ef4444; }

.stat-card--clickable {
  cursor: pointer;
  user-select: none;
}
.stat-card--clickable:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}
.stat-card--active {
  background: #f5f7ff;
  box-shadow: 0 4px 12px rgba(79, 110, 247, 0.15);
  transform: translateY(-1px);
}
.stat-card--yellow.stat-card--active { background: #fffbeb; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15); }
.stat-card--blue.stat-card--active   { background: #eff2ff; box-shadow: 0 4px 12px rgba(79, 110, 247, 0.15); }
.stat-card--green.stat-card--active  { background: #ecfdf5; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15); }
.stat-card--red.stat-card--active    { background: #fef2f2; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15); }

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

/* ── Resend icon button ──────────────────────────────────── */
.actions-cell { white-space: nowrap; text-align: center; width: 48px; }

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1.5px solid transparent;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
.icon-btn svg { width: 15px; height: 15px; }
.icon-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.icon-btn--resend:hover:not(:disabled) {
  color: #4f6ef7;
  background: #eff2ff;
  border-color: #c7d2fe;
}

.icon-btn--loading { color: #4f6ef7; }

@keyframes spin-icon { to { transform: rotate(360deg); } }
.icon-btn .spin { animation: spin-icon 0.8s linear infinite; }

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

/* ── Date-range: highlight every day inside the selected period ── */
:global(.el-date-table td.in-range .el-date-table-cell) {
  background: #dde4fd !important;
}
:global(.el-date-table td.in-range:hover .el-date-table-cell) {
  background: #c7d0fb !important;
}

/* start / end caps */
:global(.el-date-table td.start-date .el-date-table-cell),
:global(.el-date-table td.end-date   .el-date-table-cell) {
  background: #4f6ef7 !important;
  border-radius: 50% !important;
}
:global(.el-date-table td.start-date .el-date-table-cell__text),
:global(.el-date-table td.end-date   .el-date-table-cell__text) {
  color: #fff !important;
}

/* square left-half on start, right-half on end to bridge into the range bar */
:global(.el-date-table td.start-date .el-date-table-cell) {
  border-radius: 50% 0 0 50% !important;
}
:global(.el-date-table td.end-date .el-date-table-cell) {
  border-radius: 0 50% 50% 0 !important;
}

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
