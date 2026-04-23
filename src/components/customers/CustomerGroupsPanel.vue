<template>
  <Teleport to="body">
    <div class="drawer-backdrop" @click.self="$emit('close')">
      <div class="drawer">
        <!-- Header -->
        <div class="drawer-header">
          <div class="drawer-title">
            <svg viewBox="0 0 20 20" fill="currentColor" class="title-icon">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" />
            </svg>
            <div>
              <div class="drawer-title-text">User Groups</div>
              <div class="drawer-subtitle">{{ customerName }}</div>
            </div>
          </div>
          <button class="close-btn" @click="$emit('close')">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- Add group row -->
        <div class="add-row">
          <div class="select-wrap">
            <select v-model="selectedGroupId" class="select" :disabled="adding">
              <option :value="null">— Select a group to add —</option>
              <option
                v-for="g in availableGroups"
                :key="g.id"
                :value="g.id"
              >{{ g.group_name }}</option>
            </select>
          </div>
          <button
            class="btn-add"
            :disabled="!selectedGroupId || adding"
            @click="add"
          >
            <span v-if="adding" class="spinner-sm" />
            <svg v-else viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
            Add
          </button>
        </div>

        <!-- List -->
        <div class="drawer-body">
          <div v-if="loading" class="state-row">
            <span class="spinner" /> Loading…
          </div>
          <div v-else-if="loadError" class="state-row state-row--error">
            Failed to load groups.
            <button class="retry-btn" @click="load">Retry</button>
          </div>
          <div v-else-if="linked.length === 0" class="empty-state">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M6 8h36M6 24h36M6 40h36" /><circle cx="12" cy="8" r="3" /><circle cx="12" cy="24" r="3" /><circle cx="12" cy="40" r="3" />
            </svg>
            <p>No groups linked yet.</p>
          </div>
          <ul v-else class="link-list">
            <li v-for="item in linked" :key="item.id" class="link-item">
              <svg viewBox="0 0 20 20" fill="currentColor" class="item-icon">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" />
              </svg>
              <span class="item-name">{{ item.group_name }}</span>
              <button
                class="remove-btn"
                :disabled="removingId === item.id"
                title="Remove link"
                @click="remove(item.id)"
              >
                <span v-if="removingId === item.id" class="spinner-sm spinner-sm--red" />
                <svg v-else viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </li>
          </ul>
        </div>

        <div class="drawer-footer">
          <span class="footer-count">{{ linked.length }} group{{ linked.length !== 1 ? 's' : '' }} linked</span>
          <button class="btn-done" @click="$emit('close')">Done</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getCustomerGroups, addGroupCustomer, removeGroupCustomer,
  type CustomerGroup,
} from '../../services/groupCustomersService'
import { getGroups, type UserGroup } from '../../services/userGroupsService'
import { useToast } from '../../composables/useToast'

const props = defineProps<{ customerId: number; customerName: string }>()
const emit  = defineEmits<{ (e: 'close'): void }>()

const toast          = useToast()
const linked         = ref<CustomerGroup[]>([])
const allGroups      = ref<UserGroup[]>([])
const loading        = ref(false)
const loadError      = ref(false)
const adding         = ref(false)
const removingId     = ref<number | null>(null)
const selectedGroupId = ref<number | null>(null)

const linkedGroupIds = computed(() => new Set(linked.value.map(l => l.user_group_id)))

const availableGroups = computed(() =>
  allGroups.value.filter(g => !linkedGroupIds.value.has(g.id))
)

async function load() {
  loading.value   = true
  loadError.value = false
  try {
    const [linkedData, allData] = await Promise.all([
      getCustomerGroups(props.customerId),
      getGroups(),
    ])
    linked.value    = linkedData
    allGroups.value = allData
  } catch {
    loadError.value = true
    toast.error('Failed to load groups.')
  } finally {
    loading.value = false
  }
}

async function add() {
  if (!selectedGroupId.value) return
  adding.value = true
  try {
    const item = await addGroupCustomer(selectedGroupId.value, props.customerId)
    const group = allGroups.value.find(g => g.id === selectedGroupId.value)
    linked.value.push({ id: item.id, user_group_id: selectedGroupId.value, customer_id: props.customerId, group_name: group?.group_name ?? '' })
    linked.value.sort((a, b) => a.group_name.localeCompare(b.group_name))
    selectedGroupId.value = null
    toast.success('Group linked successfully.')
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg ?? 'Failed to link group.')
  } finally {
    adding.value = false
  }
}

async function remove(id: number) {
  removingId.value = id
  try {
    await removeGroupCustomer(id)
    linked.value = linked.value.filter(l => l.id !== id)
    toast.success('Group unlinked.')
  } catch {
    toast.error('Failed to remove link.')
  } finally {
    removingId.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.drawer-backdrop {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 1000;
  display: flex; justify-content: flex-end;
}
.drawer {
  width: 400px; max-width: 95vw; height: 100%;
  background: #fff; display: flex; flex-direction: column;
  box-shadow: -8px 0 32px rgba(0,0,0,0.15);
  animation: slide-in 0.22s ease;
}
@keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }

.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 20px 16px; border-bottom: 1px solid #f3f4f6; flex-shrink: 0;
}
.drawer-title { display: flex; align-items: center; gap: 12px; }
.title-icon { width: 22px; height: 22px; color: #4f6ef7; flex-shrink: 0; }
.drawer-title-text { font-size: 16px; font-weight: 700; color: #1a1f3c; }
.drawer-subtitle { font-size: 12px; color: #6b7280; margin-top: 1px; }
.close-btn {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border: none; background: #f3f4f6; border-radius: 6px; cursor: pointer; color: #6b7280;
  transition: background 0.15s; flex-shrink: 0;
}
.close-btn svg { width: 14px; height: 14px; }
.close-btn:hover { background: #e5e7eb; }

.add-row {
  display: flex; gap: 8px; align-items: center;
  padding: 14px 20px; border-bottom: 1px solid #f3f4f6; flex-shrink: 0;
}
.select-wrap { flex: 1; position: relative; }
.select {
  width: 100%; height: 36px; padding: 0 28px 0 10px;
  border: 1.5px solid #e5e7eb; border-radius: 8px;
  font-size: 13px; color: #374151; outline: none;
  appearance: none; background: #fff; cursor: pointer;
  transition: border-color 0.15s;
}
.select:focus { border-color: #4f6ef7; }
.select-wrap::after {
  content: ''; position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  border: 5px solid transparent; border-top-color: #9ca3af; pointer-events: none;
}
.btn-add {
  display: inline-flex; align-items: center; gap: 5px;
  height: 36px; padding: 0 14px;
  background: #4f6ef7; color: #fff; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
  transition: background 0.2s;
}
.btn-add svg { width: 14px; height: 14px; }
.btn-add:hover:not(:disabled) { background: #3b56e0; }
.btn-add:disabled { opacity: 0.5; cursor: not-allowed; }

.drawer-body { flex: 1; overflow-y: auto; padding: 8px 0; }
.state-row { display: flex; align-items: center; gap: 10px; padding: 28px 20px; color: #6b7280; font-size: 14px; }
.state-row--error { color: #dc2626; }
.retry-btn { margin-left: 4px; padding: 3px 10px; font-size: 12px; font-weight: 600; border: 1.5px solid #dc2626; border-radius: 5px; background: transparent; color: #dc2626; cursor: pointer; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px 20px; color: #9ca3af; }
.empty-state svg { width: 48px; height: 48px; }
.empty-state p { font-size: 13px; margin: 0; }

.link-list { list-style: none; margin: 0; padding: 4px 0; }
.link-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 20px;
  border-bottom: 1px solid #f9fafb; transition: background 0.1s;
}
.link-item:last-child { border-bottom: none; }
.link-item:hover { background: #fafafa; }
.item-icon { width: 16px; height: 16px; color: #9ca3af; flex-shrink: 0; }
.item-name { flex: 1; font-size: 14px; color: #374151; }
.remove-btn {
  width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid #fca5a5; border-radius: 6px; background: #fef2f2; color: #dc2626;
  cursor: pointer; transition: background 0.15s; flex-shrink: 0;
}
.remove-btn svg { width: 12px; height: 12px; }
.remove-btn:hover:not(:disabled) { background: #fee2e2; }
.remove-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.drawer-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-top: 1px solid #f3f4f6; flex-shrink: 0;
}
.footer-count { font-size: 13px; color: #6b7280; }
.btn-done {
  padding: 8px 20px; font-size: 13px; font-weight: 600;
  border: 1.5px solid #e5e7eb; border-radius: 8px; background: #fff;
  color: #374151; cursor: pointer; transition: border-color 0.15s;
}
.btn-done:hover { border-color: #9ca3af; }

.spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top-color: #4f6ef7; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
.spinner-sm { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
.spinner-sm--red { border-color: rgba(220,38,38,0.3); border-top-color: #dc2626; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
