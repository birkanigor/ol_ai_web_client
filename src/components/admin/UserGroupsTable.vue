<template>
  <div class="card">
    <div class="card-header">
      <span>User Groups</span>
      <span v-if="!loading && !fetchFailed" class="count-badge">{{ groups.length }}</span>
      <button class="btn-add" title="Add group">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Group
      </button>
    </div>

    <div v-if="loading" class="state-row">
      <span class="spinner" />
      <span>Loading groups…</span>
    </div>

    <div v-else-if="fetchFailed" class="state-row state-row--error">
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      Could not load user groups.
      <button class="retry-btn" @click="fetchGroups">Retry</button>
    </div>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Group Name</th>
            <th>Description</th>
            <th>Members</th>
            <th>Status</th>
            <th>Last Update</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="groups.length === 0">
            <td colspan="6" class="empty-cell">
              <div class="empty-state">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="24" cy="20" r="8" />
                  <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" />
                  <circle cx="38" cy="16" r="5" />
                  <path d="M44 32c0-5.523-3.134-10-7-10" />
                </svg>
                <p class="empty-title">No user groups yet</p>
                <p class="empty-sub">Click "Add Group" to create the first group.</p>
              </div>
            </td>
          </tr>
          <tr v-for="group in pagedGroups" :key="group.id">
            <td class="muted">{{ group.id }}</td>
            <td class="bold">{{ group.name }}</td>
            <td class="muted">{{ group.description ?? '—' }}</td>
            <td>
              <span class="count-pill">{{ group.member_count }}</span>
            </td>
            <td>
              <span class="status-pill" :class="`status-pill--${group.status.toLowerCase()}`">
                <span class="status-dot" />
                {{ group.status }}
              </span>
            </td>
            <td class="muted">{{ group.last_update }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination
      v-if="!loading && !fetchFailed"
      v-model="currentPage"
      :total="groups.length"
      :page-size="pageSize"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Pagination from '../common/Pagination.vue'

const PAGE_SIZE = Number(import.meta.env.VITE_PAGE_SIZE) || 5

interface UserGroup {
  id: number
  name: string
  description: string | null
  member_count: number
  status: string
  last_update: string
}

const groups = ref<UserGroup[]>([])
const loading = ref(false)
const fetchFailed = ref(false)
const currentPage = ref(1)
const pageSize = PAGE_SIZE

const pagedGroups = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return groups.value.slice(start, start + pageSize)
})

async function fetchGroups() {
  loading.value = true
  fetchFailed.value = false
  try {
    // TODO: replace with real API call
    // groups.value = await getGroups()
    groups.value = []
    currentPage.value = 1
  } catch {
    fetchFailed.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchGroups)
</script>

<style scoped>
.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 24px;
  border-bottom: 1px solid #f3f4f6;
  font-weight: 600;
  color: #1a1f3c;
  font-size: 15px;
  flex-shrink: 0;
}

.count-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eff2ff;
  color: #4f6ef7;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 6px 14px;
  background: #4f6ef7;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-add svg { width: 13px; height: 13px; }
.btn-add:hover { background: #3b56e0; }

.state-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 28px 24px;
  color: #6b7280;
  font-size: 14px;
}
.state-row--error { color: #dc2626; }
.state-row--error svg { width: 18px; height: 18px; flex-shrink: 0; }

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
@keyframes spin { to { transform: rotate(360deg); } }

.table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 600px;
}
.table th {
  text-align: left;
  padding: 12px 20px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #fafafa;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap;
}
.table td {
  padding: 13px 20px;
  color: #374151;
  border-bottom: 1px solid #f9fafb;
  white-space: nowrap;
}
.table tr:last-child td { border-bottom: none; }
.table tr:hover td { background: #f9fafb; }

.muted { color: #9ca3af !important; font-size: 13px; }
.bold  { font-weight: 600; color: #1a1f3c; }

.empty-cell { text-align: center; padding: 48px 20px !important; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.empty-state svg { width: 48px; height: 48px; color: #d1d5db; }
.empty-title { font-size: 15px; font-weight: 600; color: #374151; margin: 0; }
.empty-sub   { font-size: 13px; color: #9ca3af; margin: 0; }

.count-pill {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 500;
  text-transform: capitalize;
  color: #6b7280;
}
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #d1d5db; flex-shrink: 0; }
.status-pill--active .status-dot  { background: #10b981; }
.status-pill--active               { color: #059669; }
.status-pill--inactive .status-dot { background: #d1d5db; }
</style>
