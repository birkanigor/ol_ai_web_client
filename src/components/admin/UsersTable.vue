<template>
  <div class="card">
    <div class="card-header">
      <span>Users</span>
      <span v-if="!loading && !fetchFailed" class="count-badge">{{ users.length }}</span>
    </div>

    <div v-if="loading" class="state-row">
      <span class="spinner" />
      <span>Loading users…</span>
    </div>

    <div v-else-if="fetchFailed" class="state-row state-row--error">
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      Could not load users.
      <button class="retry-btn" @click="fetchUsers">Retry</button>
    </div>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Username</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Type</th>
            <th>Status</th>
            <th>Last Update</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="users.length === 0">
            <td colspan="8" class="empty-cell">No users found.</td>
          </tr>
          <tr v-for="user in pagedUsers" :key="user.id">
            <td class="muted">{{ user.id }}</td>
            <td class="bold">{{ user.user_name }}</td>
            <td>{{ user.first_name }} {{ user.last_name }}</td>
            <td class="muted">{{ user.user_email }}</td>
            <td class="muted">{{ user.user_phone_number }}</td>
            <td>
              <span class="type-badge" :class="`type-badge--${user.user_type.toLowerCase()}`">
                {{ user.user_type }}
              </span>
            </td>
            <td>
              <span class="status-pill" :class="`status-pill--${user.status.toLowerCase()}`">
                <span class="status-dot" />
                {{ user.status }}
              </span>
            </td>
            <td class="muted">{{ user.last_update }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination
      v-if="!loading && !fetchFailed"
      v-model="currentPage"
      :total="users.length"
      :page-size="pageSize"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getUsers, type UserRecord } from '../../services/authService'
import { useToast } from '../../composables/useToast'
import Pagination from '../common/Pagination.vue'

const PAGE_SIZE = Number(import.meta.env.VITE_PAGE_SIZE) || 5

const toast = useToast()
const users = ref<UserRecord[]>([])
const loading = ref(false)
const fetchFailed = ref(false)
const currentPage = ref(1)
const pageSize = PAGE_SIZE

const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return users.value.slice(start, start + pageSize)
})

async function fetchUsers() {
  loading.value = true
  fetchFailed.value = false
  try {
    users.value = await getUsers()
    currentPage.value = 1
  } catch {
    fetchFailed.value = true
    toast.error('Failed to load users. Please try again.')
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)
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

.table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 700px;
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

.muted  { color: #9ca3af !important; font-size: 13px; }
.bold   { font-weight: 600; color: #1a1f3c; }

.empty-cell { text-align: center; color: #9ca3af; padding: 32px !important; }

.type-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
  letter-spacing: 0.3px;
}
.type-badge--admin { background: #fef3c7; color: #d97706; }
.type-badge--user  { background: #eff2ff; color: #4f6ef7; }

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 500;
  text-transform: capitalize;
  color: #6b7280;
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d1d5db;
  flex-shrink: 0;
}
.status-pill--active .status-dot  { background: #10b981; }
.status-pill--active               { color: #059669; }
.status-pill--blocked .status-dot { background: #ef4444; }
.status-pill--blocked              { color: #dc2626; }
</style>
