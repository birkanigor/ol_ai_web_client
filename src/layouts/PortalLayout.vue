<template>
  <div class="portal">
    <!-- Mobile top bar -->
    <div class="topbar">
      <button class="menu-toggle" aria-label="Toggle menu" @click="sidebarOpen = !sidebarOpen">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <svg class="topbar-logo" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="#4F6EF7" />
        <path d="M12 20h16M20 12v16" stroke="#fff" stroke-width="2.5" stroke-linecap="round" />
      </svg>
      <span class="topbar-brand">Portal</span>
    </div>

    <!-- Sidebar overlay (mobile) -->
    <transition name="fade-overlay">
      <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false" />
    </transition>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar--open': sidebarOpen }">
      <div class="sidebar-header">
        <svg class="sidebar-logo" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="20" fill="#4F6EF7" />
          <path d="M12 20h16M20 12v16" stroke="#fff" stroke-width="2.5" stroke-linecap="round" />
        </svg>
        <span class="sidebar-brand">Portal</span>
        <button class="sidebar-close" aria-label="Close menu" @click="sidebarOpen = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <RouterLink to="/tasks" class="nav-item" active-class="nav-item--active" @click="sidebarOpen = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <span>Tasks</span>
        </RouterLink>

        <RouterLink to="/customers" class="nav-item" active-class="nav-item--active" @click="sidebarOpen = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          <span>Customers</span>
        </RouterLink>

        <RouterLink to="/reports" class="nav-item" active-class="nav-item--active" @click="sidebarOpen = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>Reports</span>
        </RouterLink>

        <RouterLink to="/admin" class="nav-item" active-class="nav-item--active" @click="sidebarOpen = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
          </svg>
          <span>Admin</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <button class="logout-btn" :disabled="loggingOut" @click="handleLogout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>{{ loggingOut ? 'Logging out…' : 'Logout' }}</span>
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTokenRenewal } from '../composables/useTokenRenewal'

const authStore = useAuthStore()
const router = useRouter()
const loggingOut = ref(false)
const sidebarOpen = ref(false)

useTokenRenewal()

async function handleLogout() {
  loggingOut.value = true
  try {
    await authStore.logout()
  } finally {
    loggingOut.value = false
    router.push({ name: 'Login' })
  }
}
</script>

<style scoped>
.portal {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ── Mobile top bar (hidden on desktop) ── */
.topbar {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #1a1f3c;
  z-index: 200;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.menu-toggle {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: background 0.2s;
}

.menu-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

.menu-toggle svg {
  width: 22px;
  height: 22px;
}

.topbar-logo {
  width: 28px;
  height: 28px;
}

.topbar-brand {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

/* ── Sidebar overlay ── */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 250;
}

/* ── Sidebar ── */
.sidebar {
  width: 230px;
  flex-shrink: 0;
  background: #1a1f3c;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.25);
  z-index: 300;
  transition: transform 0.28s ease;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 20px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-logo {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
}

.sidebar-brand {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.3px;
  flex: 1;
}

.sidebar-close {
  display: none;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: color 0.2s;
}

.sidebar-close svg {
  width: 20px;
  height: 20px;
}

.sidebar-close:hover {
  color: #fff;
}

/* ── Nav ── */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s, color 0.2s;
}

.nav-item svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.nav-item--active {
  background: rgba(79, 110, 247, 0.25);
  color: #7b96fa;
}

.nav-item--active:hover {
  background: rgba(79, 110, 247, 0.3);
  color: #7b96fa;
}

/* ── Footer / Logout ── */
.sidebar-footer {
  padding: 16px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 14px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.55);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.logout-btn svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.logout-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.logout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Main content ── */
.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: #f3f4f8;
  min-width: 0;
}

/* ── Overlay transitions ── */
.fade-overlay-enter-active,
.fade-overlay-leave-active {
  transition: opacity 0.25s;
}

.fade-overlay-enter-from,
.fade-overlay-leave-to {
  opacity: 0;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .topbar {
    display: flex;
  }

  .sidebar-overlay {
    display: block;
  }

  .sidebar-close {
    display: flex;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%);
  }

  .sidebar--open {
    transform: translateX(0);
  }

  .main-content {
    margin-top: 56px;
    height: calc(100vh - 56px);
  }
}
</style>
