<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <img src="../assets/logo.png" alt="OL-AI" />
      </div>
      <p class="login-subtitle">Sign in to your account</p>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="field">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Enter username"
            autocomplete="username"
            :disabled="loading"
            required
          />
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter password"
            autocomplete="current-password"
            :disabled="loading"
            required
          />
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading" class="spinner" />
          <span>{{ loading ? 'Signing in…' : 'Login' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

const username = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  const success = await authStore.login({ username: username.value, password: password.value })
  loading.value = false
  if (success) {
    router.push({ name: 'Tasks' })
  } else {
    toast.error(authStore.errorMessage || 'Login failed. Please try again.')
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1f3c 0%, #2d3561 100%);
}

.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-logo img {
  width: 220px;
  height: auto;
  margin-bottom: 8px;
  object-fit: contain;
}

.login-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 32px;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.field input {
  padding: 10px 14px;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  color: #111827;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
  background: #f9fafb;
}

.field input:focus {
  border-color: #4f6ef7;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(79, 110, 247, 0.15);
}

.field input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}


.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: #4f6ef7;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.login-btn:hover:not(:disabled) {
  background: #3b56e0;
}

.login-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

</style>
