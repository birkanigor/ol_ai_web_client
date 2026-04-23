<template>
  <div class="card">
    <div class="card-header">
      <div class="card-header-left">
        <span>Users</span>
        <span v-if="!loading && !fetchFailed" class="count-badge">{{ users.length }}</span>
      </div>
      <button class="btn-add" @click="openAdd">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add User
      </button>
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
            <th class="th-sort" :class="thClass('id')"                @click="sortBy('id')">#</th>
            <th class="th-sort" :class="thClass('user_name')"         @click="sortBy('user_name')">Username</th>
            <th class="th-sort" :class="thClass('first_name')"        @click="sortBy('first_name')">Full Name</th>
            <th class="th-sort" :class="thClass('user_email')"        @click="sortBy('user_email')">Email</th>
            <th class="th-sort" :class="thClass('user_phone_number')" @click="sortBy('user_phone_number')">Phone</th>
            <th class="th-sort" :class="thClass('user_type')"         @click="sortBy('user_type')">Type</th>
            <th class="th-sort" :class="thClass('group_name')"        @click="sortBy('group_name')">Group</th>
            <th class="th-sort" :class="thClass('status')"            @click="sortBy('status')">Status</th>
            <th class="th-sort" :class="thClass('last_update')"       @click="sortBy('last_update')">Last Update</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pagedUsers.length === 0">
            <td colspan="10" class="empty-cell">No users found.</td>
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
              <span v-if="user.group_name" class="group-badge">{{ user.group_name }}</span>
              <span v-else class="muted">—</span>
            </td>
            <td>
              <span class="status-pill" :class="`status-pill--${user.status.toLowerCase()}`">
                <span class="status-dot" />
                {{ user.status }}
              </span>
            </td>
            <td class="muted">{{ user.last_update }}</td>
            <td class="actions-cell">
              <button
                class="row-btn row-btn--edit"
                title="Edit user"
                @click="openEdit(user)"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
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
      :total="users.length"
    />

    <UserModal
      v-if="showModal"
      v-model="showModal"
      :user="editUser"
      @saved="fetchUsers"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { getUsers, type UserRecord } from '../../services/authService'
import { useToast } from '../../composables/useToast'
import { useSortable } from '../../composables/useSortable'
import Pagination from '../common/Pagination.vue'
import UserModal from './UserModal.vue'

const DEFAULT_PAGE_SIZE = Number(import.meta.env.VITE_PAGE_SIZE) || 5

const toast       = useToast()
const users       = ref<UserRecord[]>([])
const loading     = ref(false)
const fetchFailed = ref(false)
const currentPage = ref(1)
const pageSize    = ref(DEFAULT_PAGE_SIZE)
const showModal   = ref(false)
const editUser    = ref<UserRecord | null>(null)

const { sortBy, applySorted, thClass } = useSortable()

const sortedUsers = computed(() => applySorted(users.value))

const pagedUsers = computed(() => {
  if (pageSize.value === 0) return sortedUsers.value
  const start = (currentPage.value - 1) * pageSize.value
  return sortedUsers.value.slice(start, start + pageSize.value)
})

watch(pageSize, () => { currentPage.value = 1 })

async function fetchUsers() {
  loading.value     = true
  fetchFailed.value = false
  try {
    users.value   = await getUsers()
    currentPage.value = 1
  } catch {
    fetchFailed.value = true
    toast.error('Failed to load users. Please try again.')
  } finally {
    loading.value = false
  }
}

function openAdd() {
  editUser.value  = null
  showModal.value = true
}

function openEdit(user: UserRecord) {
  editUser.value  = user
  showModal.value = true
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
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
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

.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  background: #4f6ef7;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-add svg { width: 15px; height: 15px; }
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

.table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 800px;
}

.table th {
  text-align: left;
  padding: 12px 16px;
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
  padding: 12px 16px;
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
.type-badge--admin         { background: #fef3c7; color: #d97706; }
.type-badge--user          { background: #eff2ff; color: #4f6ef7; }
.type-badge--group_manager { background: #f0fdf4; color: #059669; }

.group-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  background: #f0f4ff;
  color: #4f6ef7;
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

/* ── Row action button ── */
.actions-cell {
  text-align: right;
  width: 48px;
  padding-right: 12px !important;
}

.row-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  border: 1.5px solid;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}
.row-btn svg { width: 15px; height: 15px; }

.row-btn--edit { color: #4f6ef7; background: #eff2ff; border-color: #c7d2fe; }
.row-btn--edit:hover { background: #e0e7ff; }

/* ── Sortable column headers ── */
.th-sort { cursor: pointer; user-select: none; white-space: nowrap; }
.th-sort::after { content: ' ↕'; color: #d1d5db; font-size: 10px; }
.th-sort--asc::after  { content: ' ↑'; color: #4f6ef7; }
.th-sort--desc::after { content: ' ↓'; color: #4f6ef7; }
.th-sort:hover { color: #374151; }
</style>
