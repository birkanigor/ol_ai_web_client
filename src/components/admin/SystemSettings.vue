<template>
  <div class="card settings-card">
    <div class="card-header">
      <svg viewBox="0 0 20 20" fill="currentColor" class="header-icon">
        <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
      </svg>
      System Settings
    </div>

    <div class="settings-body">
      <p class="settings-hint">Configure global system behaviour. Changes take effect immediately.</p>

      <div class="settings-list">
        <div v-for="setting in settings" :key="setting.key" class="setting-row">
          <div class="setting-info">
            <div class="setting-name">{{ setting.name }}</div>
            <div class="setting-desc">{{ setting.description }}</div>
          </div>
          <label class="toggle" :title="setting.enabled ? 'Enabled' : 'Disabled'">
            <input type="checkbox" v-model="setting.enabled" />
            <span class="toggle-slider" />
          </label>
        </div>
      </div>

      <div class="settings-footer">
        <span class="footer-note">
          {{ enabledCount }} of {{ settings.length }} settings enabled
        </span>
        <button class="save-btn" @click="save">Save changes</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from '../../composables/useToast'

const toast = useToast()

const settings = ref([
  { key: 'maintenance',    name: 'Maintenance Mode',    description: 'Restrict access to administrators only',             enabled: false },
  { key: 'logs',           name: 'Audit Logging',       description: 'Record all user actions to the audit trail',         enabled: true  },
  { key: 'notifications',  name: 'Email Notifications', description: 'Send automated alerts and digests via email',        enabled: true  },
  { key: 'twoFactor',      name: 'Two-Factor Auth',     description: 'Require 2FA for all user logins',                   enabled: false },
  { key: 'sessionTimeout', name: 'Session Timeout',     description: 'Automatically expire idle sessions after 15 min',   enabled: true  },
])

const enabledCount = computed(() => settings.value.filter((s) => s.enabled).length)

function save() {
  toast.success('Settings saved successfully.')
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
  height: 100%;
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

.header-icon { width: 18px; height: 18px; color: #4f6ef7; flex-shrink: 0; }

.settings-body { display: flex; flex-direction: column; flex: 1; min-height: 0; }

.settings-hint { padding: 14px 24px 0; font-size: 13px; color: #9ca3af; flex-shrink: 0; }

.settings-list { display: flex; flex-direction: column; flex: 1; padding: 8px 0; }

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 15px 24px;
  border-bottom: 1px solid #f9fafb;
  transition: background 0.15s;
}
.setting-row:last-child { border-bottom: none; }
.setting-row:hover { background: #fafafa; }

.setting-info { min-width: 0; }
.setting-name { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 3px; }
.setting-desc { font-size: 12px; color: #9ca3af; line-height: 1.4; }

.settings-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
  flex-shrink: 0;
  background: #fafafa;
}

.footer-note { font-size: 12px; color: #9ca3af; }

.save-btn {
  padding: 7px 18px;
  font-size: 13px;
  font-weight: 600;
  background: #4f6ef7;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.save-btn:hover { background: #3b5beb; }

.toggle { position: relative; display: inline-block; width: 42px; height: 24px; flex-shrink: 0; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute;
  inset: 0;
  background: #d1d5db;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s;
}
.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  top: 3px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.toggle input:checked + .toggle-slider { background: #4f6ef7; }
.toggle input:checked + .toggle-slider::before { transform: translateX(18px); }
</style>
