<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Reports</h1>
        <p class="page-subtitle">Scheduled reports and delivery status</p>
      </div>
      <button class="btn-refresh" :disabled="loading" @click="fetchReports">
        <svg viewBox="0 0 20 20" fill="currentColor" :class="{ spin: loading }">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
        Refresh
      </button>
    </header>

    <!-- Stats row -->
    <div v-if="!loading && !fetchFailed" class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ reports.length }}</div>
        <div class="stat-label">Total</div>
      </div>
      <div class="stat-card stat-card--green">
        <div class="stat-value">{{ countByStatus('active') }}</div>
        <div class="stat-label">Active</div>
      </div>
      <div class="stat-card stat-card--blue">
        <div class="stat-value">{{ countByStatus('running') }}</div>
        <div class="stat-label">Running</div>
      </div>
      <div class="stat-card stat-card--grey">
        <div class="stat-value">{{ countByStatus('inactive') }}</div>
        <div class="stat-label">Inactive</div>
      </div>
      <div class="stat-card stat-card--red">
        <div class="stat-value">{{ countByStatus('error') }}</div>
        <div class="stat-label">Error</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-row">
      <span class="spinner" />
      <span>Loading reports…</span>
    </div>

    <!-- Error -->
    <div v-else-if="fetchFailed" class="state-row state-row--error">
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      Could not load reports.
      <button class="retry-btn" @click="fetchReports">Retry</button>
    </div>

    <!-- Table -->
    <div v-else class="table-wrap">
      <!-- Table toolbar -->
      <div class="table-toolbar">
        <button class="btn-new" @click="editReport = null; showModal = true">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
          New Report
        </button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Report Name</th>
            <th>Source</th>
            <th>Format</th>
            <th>Schedule</th>
            <th>Delivery List</th>
            <th>Status</th>
            <th>Last Run</th>
            <th>Query</th>
            <th>Error</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pagedReports.length === 0">
            <td colspan="11" class="empty-cell">No reports found.</td>
          </tr>
          <tr v-for="report in pagedReports" :key="report.id">
            <td class="muted id-cell">{{ report.id }}</td>
            <td class="bold">{{ report.report_name ?? '—' }}</td>
            <td><span v-if="report.source_name" class="source-badge">{{ report.source_name }}</span><span v-else class="muted">—</span></td>
            <td><span v-if="report.result_format" class="format-badge">{{ report.result_format }}</span><span v-else class="muted">—</span></td>
            <td><code v-if="report.report_scheduler" class="cron">{{ report.report_scheduler }}</code><span v-else class="muted">—</span></td>
            <td class="delivery-cell">
              <template v-if="report.delivery_list">
                <span
                  v-for="email in report.delivery_list.split(',')"
                  :key="email.trim()"
                  class="email-chip"
                >{{ email.trim() }}</span>
              </template>
              <span v-else class="muted">—</span>
            </td>
            <td>
              <span class="status-pill" :class="`status-pill--${normalizeStatus(report.status_name)}`">
                <span class="status-dot" />
                {{ report.status_name ?? '—' }}
              </span>
            </td>
            <td class="muted nowrap">{{ report.last_run_time ?? '—' }}</td>
            <td>
              <button v-if="report.report_query" class="view-btn" @click="toggleQuery(report.id)">
                {{ expandedQueries.has(report.id) ? 'Hide' : 'View' }}
              </button>
              <span v-else class="muted">—</span>
              <pre v-if="expandedQueries.has(report.id)" class="query-pre">{{ report.report_query }}</pre>
            </td>
            <td>
              <span v-if="report.runtime_error" class="error-text" :title="report.runtime_error">
                {{ report.runtime_error }}
              </span>
              <span v-else class="muted">—</span>
            </td>
            <!-- Row actions -->
            <td class="actions-cell">
              <!-- Edit -->
              <button
                type="button"
                class="row-btn row-btn--edit"
                title="Edit report"
                @click="handleEdit(report)"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                </svg>
              </button>
              <!-- Run immediately -->
              <button
                type="button"
                class="row-btn row-btn--run"
                :class="{ 'row-btn--loading': runningId === report.id }"
                :disabled="runningId !== null"
                title="Run immediately"
                @click="handleRun(report)"
              >
                <svg v-if="runningId !== report.id" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
                </svg>
                <svg v-else class="spin" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
                </svg>
              </button>
              <!-- Delete -->
              <button
                type="button"
                class="row-btn row-btn--delete"
                :class="{ 'row-btn--loading': deletingId === report.id }"
                :disabled="deletingId !== null"
                title="Delete report"
                @click="handleDelete(report)"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
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
      :total="reports.length"
    />

    <NewReportModal
      v-if="showModal"
      v-model="showModal"
      :report="editReport"
      @created="fetchReports"
    />

    <ConfirmModal
      v-model="showConfirm"
      title="Delete Report"
      :message="`Delete report &quot;${confirmReport?.report_name ?? ('#' + confirmReport?.id)}&quot;? This cannot be undone.`"
      confirm-label="Delete"
      variant="danger"
      :loading="deletingId !== null"
      @confirm="confirmDelete"
      @cancel="showConfirm = false; confirmReport = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { getScheduledReports, getReportById, runReport, deleteReport, type ScheduledReport } from '../services/reportsService'
import { getToken, getSessionId } from '../services/authService'
import { API_BASE_URL } from '../config/api'
import { useToast } from '../composables/useToast'
import Pagination from '../components/common/Pagination.vue'
import NewReportModal from '../components/reports/NewReportModal.vue'
import ConfirmModal from '../components/common/ConfirmModal.vue'

const DEFAULT_PAGE_SIZE = Number(import.meta.env.VITE_PAGE_SIZE) || 5

const toast = useToast()
const reports    = ref<ScheduledReport[]>([])
const loading    = ref(false)
const fetchFailed = ref(false)
const currentPage = ref(1)
const pageSize    = ref(DEFAULT_PAGE_SIZE)
const expandedQueries = ref<Set<number>>(new Set())
const showModal       = ref(false)
const editReport      = ref<ScheduledReport | null>(null)
const runningId       = ref<number | null>(null)
const deletingId      = ref<number | null>(null)
const confirmReport   = ref<ScheduledReport | null>(null)
const showConfirm     = ref(false)

async function fetchReports() {
  loading.value    = true
  fetchFailed.value = false
  try {
    reports.value   = await getScheduledReports()
    currentPage.value = 1
  } catch {
    fetchFailed.value = true
    toast.error('Failed to load reports. Please try again.')
  } finally {
    loading.value = false
  }
}

function normalizeStatus(raw: string | null | undefined): string {
  const s = (raw ?? '').toLowerCase()
  if (s === 'fail' || s === 'error') return 'error'
  return s
}

function countByStatus(status: string): number {
  return reports.value.filter(r => normalizeStatus(r.status_name) === status).length
}

function handleEdit(report: ScheduledReport) {
  editReport.value = report
  showModal.value  = true
}

async function handleRun(report: ScheduledReport) {
  if (runningId.value !== null) return
  runningId.value = report.id
  try {
    await runReport(report.id)
    toast.success(`Report "${report.report_name ?? report.id}" queued for immediate run.`)
    await fetchReports()
  } catch {
    toast.error(`Failed to run report "${report.report_name ?? report.id}".`)
  } finally {
    runningId.value = null
  }
}

function handleDelete(report: ScheduledReport) {
  confirmReport.value = report
  showConfirm.value   = true
}

async function confirmDelete() {
  const report = confirmReport.value
  if (!report) return
  const label = report.report_name ?? `#${report.id}`
  deletingId.value = report.id
  try {
    await deleteReport(report.id)
    showConfirm.value   = false
    confirmReport.value = null
    toast.success(`Report "${label}" deleted.`)
    await fetchReports()
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg ?? `Failed to delete report "${label}".`)
  } finally {
    deletingId.value = null
  }
}

function toggleQuery(id: number) {
  const next = new Set(expandedQueries.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedQueries.value = next
}

const pagedReports = computed(() => {
  if (pageSize.value === 0) return reports.value
  const start = (currentPage.value - 1) * pageSize.value
  return reports.value.slice(start, start + pageSize.value)
})

// ── Server-Sent Events — live refresh on t_rep_reports changes ────────────
let sse: EventSource | null = null

function connectSse() {
  const token     = getToken()
  const sessionId = getSessionId()
  if (!token || !sessionId) return

  const url = `${API_BASE_URL}/api/events/reports?token=${encodeURIComponent(token)}&sessionId=${encodeURIComponent(sessionId)}`
  sse = new EventSource(url)

  sse.onmessage = async (event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data) as { reportId?: number; deleted?: boolean; refresh?: boolean }

      if (msg.refresh || msg.reportId === undefined) {
        // Fallback: full reload
        await fetchReports()
        return
      }

      if (msg.deleted) {
        // Remove the deleted row from the local list
        const idx = reports.value.findIndex(r => r.id === msg.reportId)
        if (idx !== -1) reports.value.splice(idx, 1)
        return
      }

      // INSERT or UPDATE — fetch just this report and patch / prepend
      const updated = await getReportById(msg.reportId)
      if (!updated) return

      const idx = reports.value.findIndex(r => r.id === msg.reportId)
      if (idx !== -1) {
        Object.assign(reports.value[idx], updated)
      } else {
        // New report not yet in the list — insert at top (list is ORDER BY id DESC)
        reports.value.unshift(updated)
      }
    } catch {
      // Malformed message: fall back to full reload
      await fetchReports()
    }
  }

  sse.onerror = () => {
    // EventSource auto-reconnects; nothing extra needed
  }
}

function disconnectSse() {
  sse?.close()
  sse = null
}

onMounted(() => {
  fetchReports()
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
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* ── Table toolbar ── */
.table-toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px 10px;
  border-bottom: 1px solid #e5e7eb;
}

.btn-new {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  background: #4f6ef7;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-new:hover { background: #3b56e0; }
.btn-new svg { width: 14px; height: 14px; }

/* ── Refresh button ── */
.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  background: #fff;
  color: #374151;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.btn-refresh:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-refresh svg { width: 15px; height: 15px; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.7s linear infinite; }

/* ── Stat cards ── */
.stats-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 24px;
  min-width: 110px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.stat-value { font-size: 28px; font-weight: 700; color: #111827; }
.stat-label { font-size: 12px; color: #6b7280; margin-top: 2px; text-transform: uppercase; letter-spacing: .5px; }
.stat-card--green .stat-value { color: #059669; }
.stat-card--blue  .stat-value { color: #3b56e0; }
.stat-card--grey  .stat-value { color: #6b7280; }
.stat-card--red   .stat-value { color: #dc2626; }

/* ── State rows ── */
.state-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 40px 0;
  color: #6b7280;
  font-size: 15px;
  justify-content: center;
}
.state-row svg { width: 20px; height: 20px; }
.state-row--error { color: #ef4444; }
.spinner {
  width: 20px; height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: #4f6ef7;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.retry-btn {
  padding: 4px 12px;
  background: transparent;
  border: 1.5px solid #ef4444;
  border-radius: 6px;
  color: #ef4444;
  font-size: 13px;
  cursor: pointer;
}
.retry-btn:hover { background: #fee2e2; }

/* ── Table ── */
.table-wrap {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.table th {
  padding: 11px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: #6b7280;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}
.table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  vertical-align: top;
}
.table tbody tr:last-child td { border-bottom: none; }
.table tbody tr:hover td { background: #fafafa; }

.muted  { color: #9ca3af; }
.bold   { font-weight: 600; }
.nowrap { white-space: nowrap; }
.id-cell { width: 48px; font-size: 12px; }
.empty-cell { text-align: center; padding: 40px; color: #9ca3af; }

/* ── Badges ── */
.source-badge, .format-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
}
.source-badge { background: #eff2ff; color: #4338ca; border: 1px solid #c7d2fe; }
.format-badge { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

/* ── Cron expression ── */
.cron {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 2px 6px;
  color: #374151;
  white-space: nowrap;
}

/* ── Delivery email chips ── */
.delivery-cell { max-width: 220px; }
.email-chip {
  display: inline-block;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0369a1;
  border-radius: 12px;
  font-size: 11px;
  padding: 2px 8px;
  margin: 2px 2px 2px 0;
  white-space: nowrap;
}

/* ── Status pill ── */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: #f3f4f6;
  color: #374151;
  white-space: nowrap;
}
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #d1d5db; flex-shrink: 0; }

.status-pill--active   .status-dot { background: #10b981; }
.status-pill--active   { color: #059669; }
.status-pill--running  .status-dot { background: #4f6ef7; }
.status-pill--running  { color: #3b56e0; }
.status-pill--inactive .status-dot { background: #9ca3af; }
.status-pill--inactive { color: #6b7280; }
.status-pill--error    .status-dot { background: #ef4444; }
.status-pill--error    { color: #dc2626; }

/* ── Query view/hide button ── */
.view-btn {
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
.view-btn:hover { background: #eff2ff; border-color: #4f6ef7; }

.query-pre {
  margin-top: 8px;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-width: 400px;
  color: #374151;
}

/* ── Error text ── */
.error-text {
  color: #dc2626;
  font-size: 12px;
  max-width: 200px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: help;
}

/* ── Row action buttons ── */
.actions-cell {
  white-space: nowrap;
  text-align: right;
  width: 120px;
}

.row-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1.5px solid;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.15s, filter 0.15s;
  padding: 0;
}
.row-btn + .row-btn { margin-left: 6px; }
.row-btn svg { width: 16px; height: 16px; }
.row-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.row-btn--edit {
  color: #4f6ef7;
  background: #eff2ff;
  border-color: #c7d2fe;
}
.row-btn--edit:hover:not(:disabled) { background: #e0e7ff; }

.row-btn--run {
  color: #059669;
  background: #ecfdf5;
  border-color: #6ee7b7;
}
.row-btn--run:hover:not(:disabled) { background: #d1fae5; }
.row-btn--run.row-btn--loading     { opacity: 0.7; }

.row-btn--delete {
  color: #dc2626;
  background: #fef2f2;
  border-color: #fca5a5;
}
.row-btn--delete:hover:not(:disabled) { background: #fee2e2; }

@keyframes spin { to { transform: rotate(360deg); } }
.row-btn .spin { animation: spin 0.7s linear infinite; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .page { padding: 20px 12px; }
  .stats-row { gap: 10px; }
  .stat-card { padding: 12px 16px; min-width: 80px; }
  .stat-value { font-size: 22px; }
}
</style>
