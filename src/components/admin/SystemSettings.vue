<template>
  <div class="card settings-card">
    <div class="card-header">
      <svg viewBox="0 0 20 20" fill="currentColor" class="header-icon">
        <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
      </svg>
      System Settings
      <button class="refresh-btn" :disabled="loading" title="Refresh" @click="load">
        <svg viewBox="0 0 20 20" fill="currentColor" :class="{ spin: loading }">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <div class="settings-body">
      <!-- Loading -->
      <div v-if="loading" class="state-row">
        <span class="spinner" />
        <span>Loading settings…</span>
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="state-row state-row--error">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        Failed to load settings.
        <button class="retry-btn" @click="load">Retry</button>
      </div>

      <template v-else>
        <p class="settings-hint">Configure global system behaviour. Changes are saved individually and take effect immediately.</p>

        <div class="settings-list">
          <div v-for="cfg in settings" :key="cfg.id" class="setting-row">
            <div class="setting-info">
              <div class="setting-name">{{ cfg.config_text ?? cfg.config_name }}</div>
              <div class="setting-desc">{{ cfg.config_description }}</div>
            </div>

            <div class="setting-right">
              <!-- Per-row saving spinner -->
              <span v-if="savingId === cfg.id" class="row-spinner" />

              <label class="toggle" :title="isEnabled(cfg) ? 'Enabled — click to disable' : 'Disabled — click to enable'">
                <input
                  type="checkbox"
                  :checked="isEnabled(cfg)"
                  :disabled="savingId !== null"
                  @change="toggle(cfg)"
                />
                <span class="toggle-slider" />
              </label>
            </div>
          </div>
        </div>

        <div class="settings-footer">
          <span class="footer-note">
            {{ enabledCount }} of {{ settings.length }} setting{{ settings.length !== 1 ? 's' : '' }} enabled
          </span>
          <span class="footer-info">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
            Each toggle saves automatically
          </span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getSettings, updateSetting, type SystemConfig } from '../../services/systemSettingsService'
import { useToast } from '../../composables/useToast'

const toast     = useToast()
const settings  = ref<SystemConfig[]>([])
const loading   = ref(false)
const loadError = ref(false)
const savingId  = ref<number | null>(null)

function isEnabled(cfg: SystemConfig): boolean {
  return cfg.config_value?.toLowerCase() === 'true'
}

const enabledCount = computed(() => settings.value.filter(isEnabled).length)

async function load() {
  loading.value   = true
  loadError.value = false
  try {
    settings.value = await getSettings()
  } catch {
    loadError.value = true
    toast.error('Failed to load system settings.')
  } finally {
    loading.value = false
  }
}

async function toggle(cfg: SystemConfig) {
  if (savingId.value !== null) return
  savingId.value = cfg.id
  const newValue = isEnabled(cfg) ? 'false' : 'true'
  try {
    await updateSetting(cfg.id, newValue)
    cfg.config_value = newValue
    toast.success(`"${cfg.config_text ?? cfg.config_name}" ${newValue === 'true' ? 'enabled' : 'disabled'}.`)
  } catch {
    toast.error(`Failed to update "${cfg.config_text ?? cfg.config_name}".`)
  } finally {
    savingId.value = null
  }
}

onMounted(load)
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

/* ── Header ── */
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

.refresh-btn {
  margin-left: auto;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: 1px solid #e5e7eb; border-radius: 6px;
  cursor: pointer; color: #6b7280; transition: background 0.15s;
}
.refresh-btn svg { width: 14px; height: 14px; }
.refresh-btn:hover:not(:disabled) { background: #f3f4f6; }
.refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Body ── */
.settings-body { display: flex; flex-direction: column; flex: 1; min-height: 0; }

/* ── State rows ── */
.state-row {
  display: flex; align-items: center; gap: 10px;
  padding: 28px 24px; color: #6b7280; font-size: 14px;
}
.state-row--error { color: #dc2626; }
.state-row svg { width: 18px; height: 18px; flex-shrink: 0; }
.retry-btn {
  margin-left: 6px; padding: 4px 12px; font-size: 13px; font-weight: 600;
  border: 1.5px solid #dc2626; border-radius: 6px; background: transparent;
  color: #dc2626; cursor: pointer; transition: background 0.15s;
}
.retry-btn:hover { background: #dc2626; color: #fff; }

/* ── Hint ── */
.settings-hint { padding: 14px 24px 0; font-size: 13px; color: #9ca3af; flex-shrink: 0; }

/* ── List ── */
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

.setting-info { min-width: 0; flex: 1; }
.setting-name { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 3px; }
.setting-desc { font-size: 12px; color: #9ca3af; line-height: 1.4; }

.setting-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

/* ── Per-row spinner ── */
.row-spinner {
  display: inline-block; width: 14px; height: 14px;
  border: 2px solid #e5e7eb; border-top-color: #4f6ef7;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}

/* ── Footer ── */
.settings-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 1px solid #f3f4f6;
  flex-shrink: 0;
  background: #fafafa;
}
.footer-note { font-size: 12px; color: #9ca3af; }
.footer-info {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; color: #9ca3af;
}
.footer-info svg { width: 13px; height: 13px; }

/* ── Toggle ── */
.toggle { position: relative; display: inline-block; width: 42px; height: 24px; flex-shrink: 0; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute; inset: 0;
  background: #d1d5db; border-radius: 999px;
  cursor: pointer; transition: background 0.2s;
}
.toggle-slider::before {
  content: '';
  position: absolute; width: 18px; height: 18px; left: 3px; top: 3px;
  background: #fff; border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.toggle input:checked + .toggle-slider { background: #4f6ef7; }
.toggle input:checked + .toggle-slider::before { transform: translateX(18px); }
.toggle input:disabled + .toggle-slider { opacity: 0.6; cursor: not-allowed; }

/* ── Loading spinner ── */
.spinner {
  display: inline-block; width: 16px; height: 16px;
  border: 2px solid #e5e7eb; border-top-color: #4f6ef7;
  border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.7s linear infinite; }
</style>
