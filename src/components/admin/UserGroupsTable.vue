<template>
  <div class="card">
    <!-- Header -->
    <div class="card-header">
      <span>User Groups</span>
      <span v-if="!loading && !fetchFailed" class="count-badge">{{ groups.length }}</span>
      <button class="btn-add" @click="openAdd">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Group
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-row">
      <span class="spinner" />
      <span>Loading groups…</span>
    </div>

    <!-- Error -->
    <div v-else-if="fetchFailed" class="state-row state-row--error">
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      Could not load user groups.
      <button class="retry-btn" @click="fetchGroups">Retry</button>
    </div>

    <!-- Table -->
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th class="th-sort" :class="thClass('id')"           @click="sortBy('id')">#</th>
            <th class="th-sort" :class="thClass('group_name')"   @click="sortBy('group_name')">Group Name</th>
            <th class="th-sort" :class="thClass('profile_name')" @click="sortBy('profile_name')">Profile</th>
            <th class="th-sort" :class="thClass('group_status')" @click="sortBy('group_status')">Status</th>
            <th class="th-sort" :class="thClass('created_at')"   @click="sortBy('created_at')">Created</th>
            <th class="th-sort" :class="thClass('last_updated')" @click="sortBy('last_updated')">Last Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="groups.length === 0">
            <td colspan="7" class="empty-cell">
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
            <td class="bold">{{ group.group_name ?? '—' }}</td>
            <td class="muted">{{ group.profile_name ?? '—' }}</td>
            <td>
              <span class="status-pill" :class="group.group_status === 1 ? 'status-pill--active' : 'status-pill--inactive'">
                <span class="status-dot" />
                {{ group.group_status === 1 ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="muted">{{ group.created_at ?? '—' }}</td>
            <td class="muted">{{ group.last_updated ?? '—' }}</td>
            <td class="action-cell">
              <button class="btn-customers" title="Manage customers" @click="openCustomersPanel(group)">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v1H7V5zm0 3h6v1H7V8zm0 3h4v1H7v-1z" clip-rule="evenodd" />
                </svg>
              </button>
              <button class="btn-edit" title="Edit group" @click="openEdit(group)">
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
      :total="groups.length"
    />
  </div>

  <!-- Add / Edit Modal -->
  <Teleport to="body">
    <div v-if="modalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <span>{{ editingGroup ? 'Edit Group' : 'Add Group' }}</span>
          <button class="modal-close" @click="closeModal">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Group Name -->
          <div class="field">
            <label class="label">Group Name <span class="req">*</span></label>
            <input
              v-model="form.group_name"
              class="input"
              :class="{ 'input--error': errors.group_name }"
              placeholder="e.g. Sales Team"
              @input="errors.group_name = ''"
            />
            <span v-if="errors.group_name" class="field-error">{{ errors.group_name }}</span>
          </div>

          <!-- Status -->
          <div class="field">
            <label class="label">Status <span class="req">*</span></label>
            <div class="select-wrap">
              <select v-model="form.group_status" class="input">
                <option :value="1">Active</option>
                <option :value="0">Inactive</option>
              </select>
            </div>
          </div>

          <!-- Profile -->
          <div class="field">
            <label class="label">Profile <span class="opt">(optional)</span></label>
            <div class="select-wrap">
              <select v-model="form.profile_id" class="input">
                <option :value="null">— None —</option>
                <option v-for="p in profiles" :key="p.id" :value="p.id">
                  {{ p.profile_name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" :disabled="saving" @click="closeModal">Cancel</button>
          <button class="btn-save" :disabled="saving" @click="save">
            <span v-if="saving" class="spinner-sm" />
            {{ editingGroup ? 'Save Changes' : 'Create Group' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Group-Customers drawer -->
  <GroupCustomersPanel
    v-if="customersPanel && customersPanelGroup"
    :user-group-id="customersPanelGroup.id"
    :group-name="customersPanelGroup.group_name ?? ''"
    @close="customersPanel = false; customersPanelGroup = null"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useSortable } from '../../composables/useSortable'
import Pagination from '../common/Pagination.vue'
import GroupCustomersPanel from './GroupCustomersPanel.vue'
import { getGroups, getProfiles, addGroup, updateGroup, type UserGroup, type Profile } from '../../services/userGroupsService'
import { useToast } from '../../composables/useToast'

const DEFAULT_PAGE_SIZE = Number(import.meta.env.VITE_PAGE_SIZE) || 5
const toast = useToast()

const groups   = ref<UserGroup[]>([])
const profiles = ref<Profile[]>([])
const loading    = ref(false)
const fetchFailed = ref(false)
const currentPage = ref(1)
const pageSize    = ref(DEFAULT_PAGE_SIZE)

const { sortBy, applySorted, thClass } = useSortable()

const sortedGroups = computed(() => applySorted(groups.value))

const pagedGroups = computed(() => {
  if (pageSize.value === 0) return sortedGroups.value
  const start = (currentPage.value - 1) * pageSize.value
  return sortedGroups.value.slice(start, start + pageSize.value)
})

watch(pageSize, () => { currentPage.value = 1 })

async function fetchGroups() {
  loading.value = true
  fetchFailed.value = false
  try {
    groups.value = await getGroups()
    currentPage.value = 1
  } catch {
    fetchFailed.value = true
    toast.error('Failed to load user groups.')
  } finally {
    loading.value = false
  }
}

async function fetchProfiles() {
  try {
    profiles.value = await getProfiles()
  } catch {
    // non-critical; dropdown will be empty
  }
}

onMounted(() => {
  fetchGroups()
  fetchProfiles()
})

// ── Group-Customers drawer ────────────────────────────────────────────────────
const customersPanel     = ref(false)
const customersPanelGroup = ref<UserGroup | null>(null)

function openCustomersPanel(group: UserGroup) {
  customersPanelGroup.value = group
  customersPanel.value      = true
}

// ── Modal ────────────────────────────────────────────────────────────────────
const modalOpen    = ref(false)
const saving       = ref(false)
const editingGroup = ref<UserGroup | null>(null)

interface GroupForm {
  group_name: string
  group_status: number
  profile_id: number | null
}

const form = reactive<GroupForm>({ group_name: '', group_status: 1, profile_id: null })
const errors = reactive<{ group_name: string }>({ group_name: '' })

function openAdd() {
  editingGroup.value = null
  form.group_name  = ''
  form.group_status = 1
  form.profile_id  = null
  errors.group_name = ''
  modalOpen.value = true
}

function openEdit(group: UserGroup) {
  editingGroup.value = group
  form.group_name  = group.group_name ?? ''
  form.group_status = group.group_status ?? 1
  form.profile_id  = group.profile_id ?? null
  errors.group_name = ''
  modalOpen.value = true
}

function closeModal() {
  if (saving.value) return
  modalOpen.value = false
}

function validate(): boolean {
  let ok = true
  if (!form.group_name.trim()) {
    errors.group_name = 'Group name is required'
    ok = false
  }
  return ok
}

async function save() {
  if (!validate()) return
  saving.value = true
  try {
    if (editingGroup.value) {
      await updateGroup({
        id: editingGroup.value.id,
        group_name: form.group_name.trim(),
        group_status: form.group_status,
        profile_id: form.profile_id ?? undefined,
      })
      toast.success('Group updated successfully.')
    } else {
      await addGroup({
        group_name: form.group_name.trim(),
        group_status: form.group_status,
        profile_id: form.profile_id ?? undefined,
      })
      toast.success('Group created successfully.')
    }
    modalOpen.value = false
    await fetchGroups()
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg ?? 'Failed to save group. Please try again.')
  } finally {
    saving.value = false
  }
}
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
  min-width: 640px;
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

.action-cell { width: 72px; text-align: right; white-space: nowrap; padding-right: 10px !important; }
.action-cell > button + button { margin-left: 6px; }

.btn-customers {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  color: #6b7280;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.btn-customers svg { width: 14px; height: 14px; }
.btn-customers:hover { border-color: #059669; color: #059669; background: #ecfdf5; }

.btn-edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  color: #6b7280;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.btn-edit svg { width: 14px; height: 14px; }
.btn-edit:hover { border-color: #4f6ef7; color: #4f6ef7; background: #eff2ff; }

.empty-cell { text-align: center; padding: 48px 20px !important; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.empty-state svg { width: 48px; height: 48px; color: #d1d5db; }
.empty-title { font-size: 15px; font-weight: 600; color: #374151; margin: 0; }
.empty-sub   { font-size: 13px; color: #9ca3af; margin: 0; }

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #d1d5db; flex-shrink: 0; }
.status-pill--active .status-dot  { background: #10b981; }
.status-pill--active               { color: #059669; }
.status-pill--inactive .status-dot { background: #d1d5db; }
.status-pill--inactive              { color: #9ca3af; }

/* ── Modal ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal {
  background: #fff;
  border-radius: 14px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  font-size: 16px;
  font-weight: 700;
  color: #1a1f3c;
  border-bottom: 1px solid #f3f4f6;
}

.modal-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: background 0.15s;
}
.modal-close svg { width: 14px; height: 14px; }
.modal-close:hover { background: #e5e7eb; }

.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field { display: flex; flex-direction: column; gap: 6px; }

.label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}
.req { color: #ef4444; margin-left: 2px; }
.opt { font-weight: 400; color: #9ca3af; font-size: 12px; }

.input {
  width: 100%;
  padding: 9px 12px;
  font-size: 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.15s;
  background: #fff;
  color: #1a1f3c;
  box-sizing: border-box;
}
.input:focus { border-color: #4f6ef7; }
.input--error { border-color: #ef4444; }

.select-wrap { position: relative; }
.select-wrap select { appearance: none; padding-right: 32px; cursor: pointer; }
.select-wrap::after {
  content: '';
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  border: 5px solid transparent;
  border-top-color: #9ca3af;
  pointer-events: none;
}

.field-error { font-size: 12px; color: #ef4444; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 20px;
  border-top: 1px solid #f3f4f6;
}

.btn-cancel {
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition: border-color 0.15s;
}
.btn-cancel:hover:not(:disabled) { border-color: #9ca3af; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-save {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  background: #4f6ef7;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-save:hover:not(:disabled) { background: #3b56e0; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner-sm {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

/* ── Sortable column headers ── */
.th-sort { cursor: pointer; user-select: none; white-space: nowrap; }
.th-sort::after { content: ' ↕'; color: #d1d5db; font-size: 10px; }
.th-sort--asc::after  { content: ' ↑'; color: #4f6ef7; }
.th-sort--desc::after { content: ' ↓'; color: #4f6ef7; }
.th-sort:hover { color: #374151; }
</style>
