<template>
  <div v-if="totalPages > 1 || total > 0" class="pagination">
    <span class="pagination-info">
      {{ rangeStart }}–{{ rangeEnd }} of {{ total }}
    </span>

    <div class="pagination-controls">
      <button class="page-btn page-btn--nav" :disabled="modelValue === 1" @click="go(1)" title="First page">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0L9 10.414l5.293-5.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zM5 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clip-rule="evenodd" /></svg>
      </button>

      <button class="page-btn page-btn--nav" :disabled="modelValue === 1" @click="go(modelValue - 1)" title="Previous page">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
      </button>

      <template v-for="p in visiblePages" :key="p">
        <span v-if="p === '...'" class="page-ellipsis">…</span>
        <button
          v-else
          class="page-btn"
          :class="{ 'page-btn--active': p === modelValue }"
          @click="go(p as number)"
        >{{ p }}</button>
      </template>

      <button class="page-btn page-btn--nav" :disabled="modelValue === totalPages" @click="go(modelValue + 1)" title="Next page">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
      </button>

      <button class="page-btn page-btn--nav" :disabled="modelValue === totalPages" @click="go(totalPages)" title="Last page">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L9.586 10 4.293 5.707a1 1 0 011.414-1.414l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0zM15 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clip-rule="evenodd" /></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: number   // current page (1-based)
  total: number        // total number of items
  pageSize: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', page: number): void
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const rangeStart = computed(() => props.total === 0 ? 0 : (props.modelValue - 1) * props.pageSize + 1)
const rangeEnd   = computed(() => Math.min(props.modelValue * props.pageSize, props.total))

const visiblePages = computed((): (number | '...')[] => {
  const total = totalPages.value
  const cur   = props.modelValue
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]
  if (cur > 3)            pages.push('...')
  for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p)
  if (cur < total - 2)   pages.push('...')
  pages.push(total)
  return pages
})

function go(page: number) {
  if (page < 1 || page > totalPages.value || page === props.modelValue) return
  emit('update:modelValue', page)
}
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid #f3f4f6;
  background: #fafafa;
}

.pagination-info {
  font-size: 13px;
  color: #9ca3af;
  white-space: nowrap;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 3px;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1.5px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
  font-family: inherit;
}

.page-btn:hover:not(:disabled):not(.page-btn--active) {
  border-color: #4f6ef7;
  color: #4f6ef7;
}

.page-btn--active {
  background: #4f6ef7;
  border-color: #4f6ef7;
  color: #fff;
  font-weight: 600;
  cursor: default;
}

.page-btn--nav svg {
  width: 14px;
  height: 14px;
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.page-ellipsis {
  min-width: 28px;
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
  padding: 0 2px;
}

@media (max-width: 480px) {
  .pagination { justify-content: center; }
  .pagination-info { display: none; }
}
</style>
