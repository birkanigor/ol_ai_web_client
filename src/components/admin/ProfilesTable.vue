<template>
  <div class="card">
    <!-- Header -->
    <div class="card-header">
      <span>Profiles</span>
      <span v-if="!loading && !fetchFailed" class="count-badge">{{ profiles.length }}</span>
      <button class="btn-add" @click="openAdd">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Profile
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-row">
      <span class="spinner" />
      <span>Loading profiles…</span>
    </div>

    <!-- Error -->
    <div v-else-if="fetchFailed" class="state-row state-row--error">
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      Could not load profiles.
      <button class="retry-btn" @click="fetchProfiles">Retry</button>
    </div>

    <!-- Table -->
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th class="th-sort" :class="thClass('id')"           @click="sortBy('id')">#</th>
            <th class="th-sort" :class="thClass('profile_name')" @click="sortBy('profile_name')">Profile Name</th>
            <th>Screen Access</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="profiles.length === 0">
            <td colspan="4" class="empty-cell">
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
            <td class="bold">{{ profile.profile_name ?? '—' }}</td>
            <td>
              <div class="screen-chips">
                <template v-if="enabledScreens(profile).length === 0">
                  <span class="chip chip--none">No access</span>
                </template>
                <template v-else>
                  <span
                    v-for="screen in AVAILABLE_SCREENS"
                    :key="screen"
                    class="chip"
                    :class="isEnabled(profile, screen) ? 'chip--on' : 'chip--off'"
                  >
                    {{ SCREEN_LABELS[screen] }}
                  </span>
                </template>
              </div>
            </td>
            <td class="action-cell">
              <button class="btn-edit" title="Edit profile" @click="openEdit(profile)">
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
      :total="profiles.length"
    />
  </div>

  <!-- Add / Edit Modal -->
  <Teleport to="body">
    <div v-if="modalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <span>{{ editingProfile ? 'Edit Profile' : 'Add Profile' }}</span>
          <button class="modal-close" @click="closeModal">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Name -->
          <div class="field">
            <label class="label">Profile Name <span class="req">*</span></label>
            <input
              v-model="form.profile_name"
              class="input"
              :class="{ 'input--error': errors.profile_name }"
              placeholder="e.g. Standard User"
              @input="errors.profile_name = ''"
            />
            <span v-if="errors.profile_name" class="field-error">{{ errors.profile_name }}</span>
          </div>

          <!-- Screen permissions -->
          <div class="field">
            <label class="label">Screen Access</label>
            <p class="hint">Toggle which screens this profile can access. Disabled screens will be hidden in the app.</p>
            <div class="screen-toggles">
              <div v-for="screen in AVAILABLE_SCREENS" :key="screen" class="screen-row">
                <div class="screen-info">
                  <span class="screen-name">{{ SCREEN_LABELS[screen] }}</span>
                </div>
                <label class="toggle" :title="form.screens[screen] ? 'Enabled' : 'Disabled'">
                  <input type="checkbox" v-model="form.screens[screen]" />
                  <span class="toggle-track">
                    <span class="toggle-thumb" />
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" :disabled="saving" @click="closeModal">Cancel</button>
          <button class="btn-save" :disabled="saving" @click="save">
            <span v-if="saving" class="spinner-sm" />
            {{ editingProfile ? 'Save Changes' : 'Create Profile' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useSortable } from '../../composables/useSortable'
import Pagination from '../common/Pagination.vue'
import {
  getProfiles,
  addProfile,
  updateProfile,
  AVAILABLE_SCREENS,
  SCREEN_LABELS,
  type Profile,
  type ProfileConfig,
  type ScreenName,
} from '../../services/profilesService'
import { useToast } from '../../composables/useToast'

const DEFAULT_PAGE_SIZE = Number(import.meta.env.VITE_PAGE_SIZE) || 5
const toast = useToast()

const profiles    = ref<Profile[]>([])
const loading     = ref(false)
const fetchFailed = ref(false)
const currentPage = ref(1)
const pageSize    = ref(DEFAULT_PAGE_SIZE)

const { sortBy, applySorted, thClass } = useSortable()

const sortedProfiles = computed(() => applySorted(profiles.value))

const pagedProfiles = computed(() => {
  if (pageSize.value === 0) return sortedProfiles.value
  const start = (currentPage.value - 1) * pageSize.value
  return sortedProfiles.value.slice(start, start + pageSize.value)
})

watch(pageSize, () => { currentPage.value = 1 })

function isEnabled(profile: Profile, screen: ScreenName): boolean {
  return profile.profile_config?.[screen] === true
}

function enabledScreens(profile: Profile): ScreenName[] {
  return AVAILABLE_SCREENS.filter(s => isEnabled(profile, s))
}

async function fetchProfiles() {
  loading.value = true
  fetchFailed.value = false
  try {
    profiles.value = await getProfiles()
    currentPage.value = 1
  } catch {
    fetchFailed.value = true
    toast.error('Failed to load profiles.')
  } finally {
    loading.value = false
  }
}

onMounted(fetchProfiles)

// ── Modal ────────────────────────────────────────────────────────────────────
const modalOpen      = ref(false)
const saving         = ref(false)
const editingProfile = ref<Profile | null>(null)

type ScreensForm = Record<ScreenName, boolean>

interface ProfileForm {
  profile_name: string
  screens: ScreensForm
}

function emptyScreens(): ScreensForm {
  return Object.fromEntries(AVAILABLE_SCREENS.map(s => [s, false])) as ScreensForm
}

const form   = reactive<ProfileForm>({ profile_name: '', screens: emptyScreens() })
const errors = reactive<{ profile_name: string }>({ profile_name: '' })

function openAdd() {
  editingProfile.value = null
  form.profile_name = ''
  Object.assign(form.screens, emptyScreens())
  errors.profile_name = ''
  modalOpen.value = true
}

function openEdit(profile: Profile) {
  editingProfile.value = profile
  form.profile_name = profile.profile_name ?? ''
  const screens = emptyScreens()
  if (profile.profile_config) {
    for (const screen of AVAILABLE_SCREENS) {
      screens[screen] = profile.profile_config[screen] === true
    }
  }
  Object.assign(form.screens, screens)
  errors.profile_name = ''
  modalOpen.value = true
}

function closeModal() {
  if (saving.value) return
  modalOpen.value = false
}

function buildConfig(): ProfileConfig | null {
  const hasAny = AVAILABLE_SCREENS.some(s => form.screens[s])
  if (!hasAny) return null
  return Object.fromEntries(AVAILABLE_SCREENS.map(s => [s, form.screens[s]])) as ProfileConfig
}

function validate(): boolean {
  if (!form.profile_name.trim()) {
    errors.profile_name = 'Profile name is required'
    return false
  }
  return true
}

async function save() {
  if (!validate()) return
  saving.value = true
  try {
    const config = buildConfig()
    if (editingProfile.value) {
      await updateProfile({ id: editingProfile.value.id, profile_name: form.profile_name.trim(), profile_config: config })
      toast.success('Profile updated successfully.')
    } else {
      await addProfile({ profile_name: form.profile_name.trim(), profile_config: config })
      toast.success('Profile created successfully.')
    }
    modalOpen.value = false
    await fetchProfiles()
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg ?? 'Failed to save profile. Please try again.')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
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

.state-row { display: flex; align-items: center; gap: 10px; padding: 28px 24px; color: #6b7280; font-size: 14px; }
.state-row--error { color: #dc2626; }
.state-row--error svg { width: 18px; height: 18px; flex-shrink: 0; }

.retry-btn {
  margin-left: 8px; padding: 4px 12px; font-size: 13px; font-weight: 600;
  border: 1.5px solid #dc2626; border-radius: 6px; background: transparent;
  color: #dc2626; cursor: pointer; transition: background 0.2s, color 0.2s;
}
.retry-btn:hover { background: #dc2626; color: #fff; }

.spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top-color: #4f6ef7; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }

.table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 520px; }
.table th {
  text-align: left; padding: 12px 20px; font-size: 11px; font-weight: 600;
  color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;
  background: #fafafa; border-bottom: 1px solid #f3f4f6; white-space: nowrap;
}
.table td { padding: 13px 20px; color: #374151; border-bottom: 1px solid #f9fafb; }
.table tr:last-child td { border-bottom: none; }
.table tr:hover td { background: #f9fafb; }

.muted { color: #9ca3af !important; font-size: 13px; }
.bold  { font-weight: 600; color: #1a1f3c; white-space: nowrap; }

.action-cell { width: 48px; text-align: center; }
.btn-edit {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border: 1px solid #e5e7eb; border-radius: 6px;
  background: #fff; color: #6b7280; cursor: pointer; transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.btn-edit svg { width: 14px; height: 14px; }
.btn-edit:hover { border-color: #4f6ef7; color: #4f6ef7; background: #eff2ff; }

.empty-cell { text-align: center; padding: 48px 20px !important; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.empty-state svg { width: 48px; height: 48px; color: #d1d5db; }
.empty-title { font-size: 15px; font-weight: 600; color: #374151; margin: 0; }
.empty-sub   { font-size: 13px; color: #9ca3af; margin: 0; }

/* Screen access chips in the table */
.screen-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.chip {
  font-size: 11px; font-weight: 600; padding: 2px 9px;
  border-radius: 999px; letter-spacing: 0.2px;
}
.chip--on   { background: #d1fae5; color: #059669; }
.chip--off  { background: #f3f4f6; color: #9ca3af; }
.chip--none { background: #fef2f2; color: #ef4444; }

/* ── Modal ── */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 16px;
}
.modal {
  background: #fff; border-radius: 14px; width: 100%; max-width: 460px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18); display: flex; flex-direction: column; overflow: hidden;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px; font-size: 16px; font-weight: 700; color: #1a1f3c;
  border-bottom: 1px solid #f3f4f6;
}
.modal-close {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border: none; background: #f3f4f6; border-radius: 6px; cursor: pointer; color: #6b7280; transition: background 0.15s;
}
.modal-close svg { width: 14px; height: 14px; }
.modal-close:hover { background: #e5e7eb; }

.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 18px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.label { font-size: 13px; font-weight: 600; color: #374151; }
.req { color: #ef4444; margin-left: 2px; }
.hint { font-size: 12px; color: #9ca3af; margin: 0; }

.input {
  width: 100%; padding: 9px 12px; font-size: 14px;
  border: 1.5px solid #e5e7eb; border-radius: 8px; outline: none;
  transition: border-color 0.15s; background: #fff; color: #1a1f3c; box-sizing: border-box;
}
.input:focus { border-color: #4f6ef7; }
.input--error { border-color: #ef4444; }
.field-error { font-size: 12px; color: #ef4444; }

/* Screen toggle list */
.screen-toggles {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid #f3f4f6;
  border-radius: 10px;
  overflow: hidden;
}
.screen-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f9fafb;
  transition: background 0.15s;
}
.screen-row:last-child { border-bottom: none; }
.screen-row:hover { background: #fafafa; }

.screen-name { font-size: 14px; font-weight: 500; color: #374151; }

/* Toggle switch */
.toggle { position: relative; display: inline-flex; cursor: pointer; }
.toggle input { position: absolute; opacity: 0; width: 0; height: 0; }

.toggle-track {
  width: 38px; height: 22px;
  background: #e5e7eb; border-radius: 999px;
  transition: background 0.2s;
  display: flex; align-items: center; padding: 2px;
  box-sizing: border-box;
}
.toggle input:checked ~ .toggle-track { background: #4f6ef7; }

.toggle-thumb {
  width: 18px; height: 18px;
  background: #fff; border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.2s;
  flex-shrink: 0;
}
.toggle input:checked ~ .toggle-track .toggle-thumb { transform: translateX(16px); }

/* Footer */
.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px 20px; border-top: 1px solid #f3f4f6;
}
.btn-cancel {
  padding: 8px 18px; font-size: 14px; font-weight: 600;
  border: 1.5px solid #e5e7eb; border-radius: 8px; background: #fff;
  color: #374151; cursor: pointer; transition: border-color 0.15s;
}
.btn-cancel:hover:not(:disabled) { border-color: #9ca3af; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-save {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 20px; font-size: 14px; font-weight: 600;
  border: none; border-radius: 8px; background: #4f6ef7; color: #fff;
  cursor: pointer; transition: background 0.2s;
}
.btn-save:hover:not(:disabled) { background: #3b56e0; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.spinner-sm {
  width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0;
}

/* ── Sortable column headers ── */
.th-sort { cursor: pointer; user-select: none; white-space: nowrap; }
.th-sort::after { content: ' ↕'; color: #d1d5db; font-size: 10px; }
.th-sort--asc::after  { content: ' ↑'; color: #4f6ef7; }
.th-sort--desc::after { content: ' ↓'; color: #4f6ef7; }
.th-sort:hover { color: #374151; }
</style>
