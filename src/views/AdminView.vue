<template>
  <div class="page">
    <header class="page-header">
      <h1>Admin</h1>
      <p class="page-subtitle">System administration and user management</p>
    </header>

    <div class="page-body">
      <!-- Main content with tab navigation -->
      <div class="main-col">
        <nav class="tab-bar" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab"
            :class="{ 'tab--active': activeTab === tab.id }"
            role="tab"
            :aria-selected="activeTab === tab.id"
            @click="activeTab = tab.id"
          >
            <component :is="tab.icon" class="tab-icon" />
            {{ tab.label }}
          </button>
        </nav>

        <div class="tab-content">
          <UsersTable      v-if="activeTab === 'users'"  />
          <UserGroupsTable v-if="activeTab === 'groups'" />
          <ProfilesTable   v-if="activeTab === 'profiles'" />
        </div>
      </div>

      <!-- Persistent settings sidebar -->
      <SystemSettings />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineComponent, h } from 'vue'
import UsersTable      from '../components/admin/UsersTable.vue'
import UserGroupsTable from '../components/admin/UserGroupsTable.vue'
import ProfilesTable   from '../components/admin/ProfilesTable.vue'
import SystemSettings  from '../components/admin/SystemSettings.vue'

const activeTab = ref<'users' | 'groups' | 'profiles'>('users')

const UsersIcon = defineComponent({
  render: () =>
    h('svg', { viewBox: '0 0 20 20', fill: 'currentColor' }, [
      h('path', {
        'fill-rule': 'evenodd',
        d: 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z',
        'clip-rule': 'evenodd',
      }),
    ]),
})

const GroupsIcon = defineComponent({
  render: () =>
    h('svg', { viewBox: '0 0 20 20', fill: 'currentColor' }, [
      h('path', {
        d: 'M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z',
      }),
    ]),
})

const ProfilesIcon = defineComponent({
  render: () =>
    h('svg', { viewBox: '0 0 20 20', fill: 'currentColor' }, [
      h('path', {
        'fill-rule': 'evenodd',
        d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z',
        'clip-rule': 'evenodd',
      }),
    ]),
})

const tabs = [
  { id: 'users'    as const, label: 'Users',       icon: UsersIcon    },
  { id: 'groups'   as const, label: 'User Groups',  icon: GroupsIcon   },
  { id: 'profiles' as const, label: 'Profiles',     icon: ProfilesIcon },
]
</script>

<style scoped>
.page {
  padding: 32px 24px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 28px;
  flex-shrink: 0;
}
.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1f3c;
  margin: 0 0 4px;
}
.page-subtitle {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.page-body {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  flex: 1;
  min-height: 0;
  align-items: start;
}

/* ── Main column ── */
.main-col {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

/* ── Tab bar ── */
.tab-bar {
  display: flex;
  gap: 2px;
  background: #fff;
  border-radius: 12px 12px 0 0;
  border: 1px solid #f3f4f6;
  border-bottom: none;
  padding: 8px 8px 0;
  flex-shrink: 0;
}

.tab {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  font-size: 13.5px;
  font-weight: 500;
  color: #6b7280;
  background: transparent;
  border: none;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  white-space: nowrap;
  position: relative;
}

.tab:hover {
  color: #374151;
  background: #f9fafb;
}

.tab--active {
  color: #4f6ef7;
  font-weight: 600;
  background: #f5f7ff;
}

.tab--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 8px;
  right: 8px;
  height: 2px;
  background: #4f6ef7;
  border-radius: 2px 2px 0 0;
}

.tab-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

/* ── Tab content ── */
.tab-content {
  border-radius: 0 0 12px 12px;
  overflow: hidden;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .page-body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .tab { padding: 8px 12px; font-size: 13px; }
  .tab-icon { display: none; }
}

@media (max-width: 480px) {
  .page { padding: 20px 16px; }
}
</style>
