<template>
  <Teleport to="body">
    <div class="modal-backdrop" @mousedown.self="$emit('update:modelValue', false)">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
        <div class="modal-header">
          <h2 id="user-modal-title">{{ isEdit ? 'Edit User' : 'Add User' }}</h2>
          <button class="close-btn" aria-label="Close" @click="$emit('update:modelValue', false)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form class="modal-body" @submit.prevent="handleSubmit">
          <div class="form-grid">
            <!-- Username (add only) -->
            <div class="form-group" :class="{ 'form-group--full': isEdit }">
              <label class="form-label">Username <span class="req">*</span></label>
              <input
                v-if="!isEdit"
                v-model="form.user_name"
                class="form-input"
                type="text"
                placeholder="e.g. john.doe"
                required
                autocomplete="off"
              />
              <div v-else class="form-static">{{ user!.user_name }}</div>
            </div>

            <!-- Password (add only) -->
            <div v-if="!isEdit" class="form-group">
              <label class="form-label">Password <span class="req">*</span></label>
              <input
                v-model="form.password"
                class="form-input"
                type="password"
                placeholder="Min. 6 characters"
                required
                autocomplete="new-password"
              />
            </div>

            <!-- First name -->
            <div class="form-group">
              <label class="form-label">First Name <span class="req">*</span></label>
              <input v-model="form.first_name" class="form-input" type="text" placeholder="First name" required />
            </div>

            <!-- Last name -->
            <div class="form-group">
              <label class="form-label">Last Name <span class="req">*</span></label>
              <input v-model="form.last_name" class="form-input" type="text" placeholder="Last name" required />
            </div>

            <!-- Email -->
            <div class="form-group">
              <label class="form-label">Email <span class="req">*</span></label>
              <input v-model="form.user_email" class="form-input" type="email" placeholder="email@example.com" required />
            </div>

            <!-- Phone -->
            <div class="form-group">
              <label class="form-label">Phone <span class="req">*</span></label>
              <input v-model="form.user_phone_number" class="form-input" type="text" placeholder="+1 555 000 0000" required />
            </div>

            <!-- User type (add only) -->
            <div v-if="!isEdit" class="form-group">
              <label class="form-label">User Type <span class="req">*</span></label>
              <select v-model="form.user_type" class="form-input form-select" required>
                <option :value="1">ADMIN</option>
                <option :value="2">GROUP_MANAGER</option>
                <option :value="3">USER</option>
              </select>
            </div>

            <!-- User Group -->
            <div class="form-group">
              <label class="form-label">User Group</label>
              <select v-model="form.user_group_id" class="form-input form-select">
                <option :value="null">— No group —</option>
                <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.group_name }}</option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn--ghost" @click="$emit('update:modelValue', false)">Cancel</button>
            <button type="submit" class="btn btn--primary" :disabled="submitting">
              <svg v-if="submitting" class="spin" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
              </svg>
              {{ submitting ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Add User') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { addUser, updateUser, type UserRecord } from '../../services/authService'
import { getGroups, type UserGroup } from '../../services/userGroupsService'
import { useToast } from '../../composables/useToast'

const props = defineProps<{
  modelValue: boolean
  user?: UserRecord | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved'): void
}>()

const isEdit  = computed(() => !!props.user)
const toast   = useToast()
const groups  = ref<UserGroup[]>([])

const u = props.user
const form = reactive({
  user_name:         '',
  password:          '',
  first_name:        u?.first_name        ?? '',
  last_name:         u?.last_name         ?? '',
  user_email:        u?.user_email        ?? '',
  user_phone_number: u?.user_phone_number ?? '',
  user_type:         1 as 1 | 2 | 3,
  user_group_id:     (u?.user_group_id    ?? null) as number | null,
})

onMounted(async () => {
  try {
    groups.value = await getGroups()
  } catch {
    toast.error('Failed to load user groups.')
  }
})

const submitting = ref(false)

async function handleSubmit() {
  submitting.value = true
  try {
    if (isEdit.value && props.user) {
      await updateUser({
        userId:      props.user.id,
        firstName:   form.first_name,
        lastName:    form.last_name,
        phoneNumber: form.user_phone_number,
        email:       form.user_email,
        userGroupId: form.user_group_id,
      })
      toast.success(`User "${props.user.user_name}" updated.`)
    } else {
      await addUser({
        user_name:         form.user_name,
        first_name:        form.first_name,
        last_name:         form.last_name,
        user_phone_number: form.user_phone_number,
        user_email:        form.user_email,
        user_type:         form.user_type,
        password:          form.password,
        user_group_id:     form.user_group_id,
      })
      toast.success(`User "${form.user_name}" created.`)
    }
    emit('saved')
    emit('update:modelValue', false)
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg ?? (isEdit.value ? 'Failed to update user.' : 'Failed to create user.'))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #1a1f3c;
}

.close-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #9ca3af;
  transition: background 0.15s, color 0.15s;
}
.close-btn svg { width: 18px; height: 18px; }
.close-btn:hover { background: #f3f4f6; color: #374151; }

.modal-body {
  padding: 20px 24px 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group--full { grid-column: 1 / -1; }

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}
.req { color: #ef4444; margin-left: 2px; }

.form-input {
  height: 38px;
  padding: 0 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #1a1f3c;
  background: #fff;
  transition: border-color 0.15s;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus { border-color: #4f6ef7; }
.form-select { appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 32px; }

.form-static {
  height: 38px;
  padding: 0 12px;
  border: 1.5px solid #f3f4f6;
  border-radius: 8px;
  font-size: 14px;
  color: #6b7280;
  background: #fafafa;
  display: flex;
  align-items: center;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 0 24px;
  margin-top: 20px;
  border-top: 1px solid #f3f4f6;
}

.btn {
  height: 38px;
  padding: 0 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: background 0.15s, opacity 0.15s;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn--primary { background: #4f6ef7; color: #fff; }
.btn--primary:hover:not(:disabled) { background: #3b56e0; }
.btn--ghost { background: transparent; color: #6b7280; border: 1.5px solid #e5e7eb; }
.btn--ghost:hover { background: #f9fafb; }

.spin {
  width: 16px;
  height: 16px;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 540px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
