<template>
  <div class="page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1>Customers</h1>
        <p class="page-subtitle">Manage business customers</p>
      </div>
      <button class="btn-refresh" :disabled="loading" @click="fetchCustomers">
        <svg viewBox="0 0 20 20" fill="currentColor" :class="{ spin: loading }">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
        Refresh
      </button>
    </header>

    <!-- Stat cards -->
    <div v-if="!loading && !fetchFailed" class="stats-row">
      <div class="stat-card" @click="setStatusFilter('')">
        <div class="stat-value">{{ customers.length }}</div>
        <div class="stat-label">Total</div>
      </div>
      <div class="stat-card stat-card--green" @click="setStatusFilter('active')">
        <div class="stat-value">{{ countByStatus('active') }}</div>
        <div class="stat-label">Active</div>
      </div>
      <div class="stat-card stat-card--grey" @click="setStatusFilter('deactivated')">
        <div class="stat-value">{{ countByStatus('deactivated') }}</div>
        <div class="stat-label">Deactivated</div>
      </div>
      <div class="stat-card stat-card--yellow" @click="setStatusFilter('suspended')">
        <div class="stat-value">{{ countByStatus('suspended') }}</div>
        <div class="stat-label">Suspended</div>
      </div>
      <div class="stat-card stat-card--red" @click="setStatusFilter('deleted')">
        <div class="stat-value">{{ countByStatus('deleted') }}</div>
        <div class="stat-label">Deleted</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-row">
      <span class="spinner" />
      <span>Loading customers…</span>
    </div>

    <!-- Error -->
    <div v-else-if="fetchFailed" class="state-row state-row--error">
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      Failed to load customers.
      <button class="retry-btn" @click="fetchCustomers">Retry</button>
    </div>

    <!-- Table -->
    <div v-else class="table-wrap">
      <!-- Filters + toolbar -->
      <div class="table-toolbar">
        <div class="filters">
          <input
            v-model="filterName"
            class="filter-input"
            type="text"
            placeholder="Search by name…"
          />
          <input
            v-model="filterRef"
            class="filter-input"
            type="text"
            placeholder="Reference ID…"
          />
          <select v-model="filterStatus" class="filter-select">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>
          <button v-if="isFiltered" class="btn-clear" @click="clearFilters">Clear</button>
        </div>
        <button class="btn-new" @click="editCustomer = null; showModal = true">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          New Customer
        </button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Description</th>
            <th>Reference ID</th>
            <th>Billing Address</th>
            <th>Status</th>
            <th>Created</th>
            <th>Config</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pagedCustomers.length === 0">
            <td colspan="9" class="empty-cell">
              {{ isFiltered ? 'No customers match the current filters.' : 'No customers found.' }}
            </td>
          </tr>
          <tr v-for="c in pagedCustomers" :key="c.id">
            <td class="muted id-cell">{{ c.id }}</td>
            <td class="bold">{{ c.customer_name }}</td>
            <td class="muted">{{ c.customer_description ?? '—' }}</td>
            <td class="muted">{{ c.reference_id ?? '—' }}</td>
            <td class="muted addr-cell">{{ c.billing_address ?? '—' }}</td>
            <td>
              <span class="status-pill" :class="`status-pill--${normalizeStatus(c.status_name)}`">
                <span class="status-dot" />
                {{ c.status_name ?? '—' }}
              </span>
            </td>
            <td class="muted nowrap">{{ c.created_date ?? '—' }}</td>
            <td>
              <button v-if="c.additional_config" class="view-btn" @click="toggleConfig(c.id)">
                {{ expandedConfigs.has(c.id) ? 'Hide' : 'View' }}
              </button>
              <span v-else class="muted">—</span>
              <pre v-if="expandedConfigs.has(c.id)" class="config-pre">{{ JSON.stringify(c.additional_config, null, 2) }}</pre>
            </td>
            <td class="actions-cell">
              <button type="button" class="row-btn row-btn--edit" title="Edit customer" @click="openEdit(c)">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button
                v-if="normalizeStatus(c.status_name) !== 'deleted'"
                type="button"
                class="row-btn row-btn--delete"
                title="Mark as deleted"
                @click="handleDelete(c)"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
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
      :total="filteredCustomers.length"
    />

    <!-- Modals -->
    <CustomerModal
      v-if="showModal"
      v-model="showModal"
      :customer="editCustomer"
      @saved="fetchCustomers"
    />

    <ConfirmModal
      v-model="showConfirm"
      title="Delete Customer"
      :message="`Mark customer &quot;${confirmCustomer?.customer_name ?? ('#' + confirmCustomer?.id)}&quot; as deleted?`"
      confirm-label="Delete"
      variant="danger"
      :loading="deletingId !== null"
      @confirm="confirmDelete"
      @cancel="showConfirm = false; confirmCustomer = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getCustomers, changeCustomerStatus, type Customer,
} from '../services/customersService'
import { useToast } from '../composables/useToast'
import Pagination from '../components/common/Pagination.vue'
import CustomerModal from '../components/customers/CustomerModal.vue'
import ConfirmModal from '../components/common/ConfirmModal.vue'

const DEFAULT_PAGE_SIZE = Number(import.meta.env.VITE_PAGE_SIZE) || 5

const toast           = useToast()
const customers       = ref<Customer[]>([])
const loading         = ref(false)
const fetchFailed     = ref(false)
const currentPage     = ref(1)
const pageSize        = ref(DEFAULT_PAGE_SIZE)
const expandedConfigs = ref<Set<number>>(new Set())
const showModal       = ref(false)
const editCustomer    = ref<Customer | null>(null)
const showConfirm     = ref(false)
const confirmCustomer = ref<Customer | null>(null)
const deletingId      = ref<number | null>(null)

// Filters
const filterName   = ref('')
const filterRef    = ref('')
const filterStatus = ref('')

async function fetchCustomers() {
  loading.value     = true
  fetchFailed.value = false
  try {
    customers.value = await getCustomers()
    currentPage.value = 1
  } catch {
    fetchFailed.value = true
    toast.error('Failed to load customers.')
  } finally {
    loading.value = false
  }
}

function normalizeStatus(raw: string | null | undefined): string {
  return (raw ?? '').toLowerCase()
}

function countByStatus(status: string): number {
  return customers.value.filter(c => normalizeStatus(c.status_name) === status).length
}

function setStatusFilter(status: string) {
  filterStatus.value = filterStatus.value === status ? '' : status
  currentPage.value  = 1
}

function clearFilters() {
  filterName.value   = ''
  filterRef.value    = ''
  filterStatus.value = ''
  currentPage.value  = 1
}

const isFiltered = computed(() =>
  !!(filterName.value || filterRef.value || filterStatus.value),
)

const filteredCustomers = computed(() => {
  let list = customers.value
  if (filterName.value)
    list = list.filter(c => c.customer_name.toLowerCase().includes(filterName.value.toLowerCase()))
  if (filterRef.value)
    list = list.filter(c => (c.reference_id ?? '').toLowerCase().includes(filterRef.value.toLowerCase()))
  if (filterStatus.value)
    list = list.filter(c => normalizeStatus(c.status_name) === filterStatus.value)
  return list
})

const pagedCustomers = computed(() => {
  if (pageSize.value === 0) return filteredCustomers.value
  const start = (currentPage.value - 1) * pageSize.value
  return filteredCustomers.value.slice(start, start + pageSize.value)
})

function toggleConfig(id: number) {
  const next = new Set(expandedConfigs.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedConfigs.value = next
}

function openEdit(c: Customer) {
  editCustomer.value = c
  showModal.value    = true
}

function handleDelete(c: Customer) {
  confirmCustomer.value = c
  showConfirm.value     = true
}

async function confirmDelete() {
  const c = confirmCustomer.value
  if (!c) return
  deletingId.value = c.id
  try {
    await changeCustomerStatus(c.id, 4)
    showConfirm.value     = false
    confirmCustomer.value = null
    toast.success(`Customer "${c.customer_name}" marked as deleted.`)
    await fetchCustomers()
  } catch {
    toast.error(`Failed to delete customer "${c.customer_name}".`)
  } finally {
    deletingId.value = null
  }
}

onMounted(fetchCustomers)
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 24px; }

/* ── Header ── */
.page-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
}
.page-header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #1a1f3c; }
.page-subtitle { margin: 4px 0 0; font-size: 14px; color: #6b7280; }

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

/* ── Stat cards ── */
.stats-row { display: flex; gap: 14px; flex-wrap: wrap; }
.stat-card {
  flex: 1; min-width: 110px; padding: 16px 20px;
  background: #fff; border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  cursor: pointer; transition: box-shadow 0.15s, transform 0.1s;
}
.stat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-1px); }
.stat-value { font-size: 26px; font-weight: 700; color: #1a1f3c; line-height: 1.1; }
.stat-label { font-size: 12px; font-weight: 600; color: #9ca3af; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.stat-card--green  .stat-value { color: #059669; }
.stat-card--grey   .stat-value { color: #6b7280; }
.stat-card--yellow .stat-value { color: #d97706; }
.stat-card--red    .stat-value { color: #dc2626; }

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

.filters {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}

.filter-input, .filter-select {
  height: 34px; padding: 0 10px;
  border: 1.5px solid #e5e7eb; border-radius: 7px;
  font-size: 13px; color: #374151; outline: none;
  transition: border-color 0.15s; background: #fff;
}
.filter-input:focus, .filter-select:focus { border-color: #4f6ef7; }
.filter-input { min-width: 160px; }
.filter-select {
  appearance: none; cursor: pointer; padding-right: 28px;
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

.btn-new {
  display: inline-flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 16px;
  background: #4f6ef7; color: #fff; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
  transition: background 0.15s;
}
.btn-new svg { width: 15px; height: 15px; }
.btn-new:hover { background: #3b56e0; }

/* ── Table ── */
.table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 900px; }
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

.muted     { color: #9ca3af !important; font-size: 13px; }
.bold      { font-weight: 600; color: #1a1f3c; }
.nowrap    { white-space: nowrap; }
.id-cell   { width: 48px; }
.addr-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
.empty-cell { text-align: center; color: #9ca3af; padding: 32px !important; }

/* ── Status pill ── */
.status-pill {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 13px; font-weight: 500; text-transform: capitalize; color: #6b7280;
}
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #d1d5db; flex-shrink: 0; }
.status-pill--active      .status-dot { background: #10b981; }
.status-pill--active      { color: #059669; }
.status-pill--deactivated .status-dot { background: #9ca3af; }
.status-pill--deactivated { color: #6b7280; }
.status-pill--suspended   .status-dot { background: #f59e0b; }
.status-pill--suspended   { color: #d97706; }
.status-pill--deleted     .status-dot { background: #ef4444; }
.status-pill--deleted     { color: #dc2626; }

/* ── Config view/hide ── */
.view-btn {
  font-size: 12px; font-weight: 600; color: #4f6ef7;
  background: #eff2ff; border: none; border-radius: 5px;
  padding: 3px 10px; cursor: pointer; transition: background 0.15s;
}
.view-btn:hover { background: #e0e7ff; }
.config-pre {
  margin: 6px 0 0; font-size: 12px; white-space: pre-wrap;
  background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;
  padding: 8px 10px; color: #374151; max-width: 300px; max-height: 160px; overflow: auto;
}

/* ── Row action buttons ── */
.actions-cell { text-align: right; white-space: nowrap; width: 90px; padding-right: 12px !important; }
.row-btn {
  width: 32px; height: 32px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 7px; border: 1.5px solid; cursor: pointer;
  transition: background 0.15s; flex-shrink: 0;
}
.row-btn + .row-btn { margin-left: 6px; }
.row-btn svg { width: 15px; height: 15px; }

.row-btn--edit   { color: #4f6ef7; background: #eff2ff; border-color: #c7d2fe; }
.row-btn--edit:hover { background: #e0e7ff; }
.row-btn--delete { color: #dc2626; background: #fef2f2; border-color: #fca5a5; }
.row-btn--delete:hover { background: #fee2e2; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.7s linear infinite; }

@media (max-width: 768px) {
  .stats-row { gap: 10px; }
  .stat-card { min-width: 90px; padding: 12px 14px; }
  .table-toolbar { flex-direction: column; align-items: stretch; }
  .filters { flex-direction: column; align-items: stretch; }
  .filter-input, .filter-select { width: 100%; }
}
</style>
