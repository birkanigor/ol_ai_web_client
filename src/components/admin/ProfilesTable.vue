<template>
  <div class="card">
    <div class="card-header">
      <span>Profiles</span>
      <span v-if="!loading && !fetchFailed" class="count-badge">{{ profiles.length }}</span>
      <button class="btn-add" title="Add profile">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Profile
      </button>
    </div>

    <div v-if="loading" class="state-row">
      <span class="spinner" />
      <span>Loading profiles…</span>
    </div>

    <div v-else-if="fetchFailed" class="state-row state-row--error">
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      Could not load profiles.
      <button class="retry-btn" @click="fetchProfiles">Retry</button>
    </div>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Profile Name</th>
            <th>Description</th>
            <th>Permissions</th>
            <th>Status</th>
            <th>Last Update</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="profiles.length === 0">
            <td colspan="6" class="empty-cell">
              <div class="empty-state">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="6" y="10" width="36" height="28" rx="4" />
                  <circle cx="24" cy="22" r="6" />
                  <path d="M12 38c0-6.627 5.373-12 12-12s12 5.373 12 12" />
                </svg>
                <p class="empty-title">No profiles yet</p>
                <p class="empty-sub">Click "Add Profile" to define the first access profile.</p>
              </div>
            </td>
          </tr>
          <tr v-for="profile in pagedProfiles" :key="profile.id">
            <td class="muted">{{ profile.id }}</td>
            <td class="bold">{{ profile.name }}</td>
            <td class="muted">{{ profile.description ?? '—' }}</td>
            <td>
              <span class="count-pill">{{ profile.permission_count }}</span>
            </td>
            <td>
              <span class="status-pill" :class="`status-pill--${profile.status.toLowerCase()}`">
                <span class="status-dot" />
                {{ profile.status }}
              </span>
            </td>
            <td class="muted">{{ profile.last_update }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination
      v-if="!loading && !fetchFailed"
      v-model="currentPage"
      :total="profiles.length"
      :page-size="pageSize"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Pagination from '../common/Pagination.vue'

const PAGE_SIZE = Number(import.meta.env.VITE_PAGE_SIZE) || 5

interface Profile {
  id: number
  name: string
  description: string | null
  permission_count: number
  status: string
  last_update: string
}

const profiles = ref<Profile[]>([])
const loading = ref(false)
const fetchFailed = ref(false)
const currentPage = ref(1)
const pageSize = PAGE_SIZE

const pagedProfiles = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return profiles.value.slice(start, start + pageSize)
})

async function fetchProfiles() {
  loading.value = true
  fetchFailed.value = false
  try {
    // TODO: replace with real API call
    // profiles.value = await getProfiles()
    profiles.value = []
    currentPage.value = 1
  } catch {
    fetchFailed.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchProfiles)
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
.status-pill--active .status-dot   { background: #10b981; }
.status-pill--active                { color: #059669; }
.status-pill--inactive .status-dot { background: #d1d5db; }
</style>
