<template>
  <div class="stats-row">
    <div
      v-for="card in cards"
      :key="card.filterValue"
      class="stat-card stat-card--clickable"
      :class="[
        card.color ? `stat-card--${card.color}` : '',
        { 'stat-card--active': modelValue === card.filterValue },
      ]"
      :title="card.filterValue ? `Filter by ${card.label}` : 'Show all'"
      @click="onCardClick(card.filterValue)"
    >
      <div class="stat-value">{{ card.value }}</div>
      <div class="stat-label">{{ card.label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface StatCard {
  value: number
  label: string
  color?: 'green' | 'blue' | 'red' | 'yellow' | 'grey'
  filterValue: string
}

const props = defineProps<{
  cards: StatCard[]
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onCardClick(filterValue: string) {
  if (filterValue === '') {
    emit('update:modelValue', '')
  } else {
    emit('update:modelValue', props.modelValue === filterValue ? '' : filterValue)
  }
}
</script>

<style scoped>
.stats-row { display: flex; gap: 14px; flex-wrap: wrap; }

.stat-card {
  flex: 1 1 100px;
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
  border-left: 4px solid #e5e7eb;
  transition: box-shadow 0.15s, transform 0.15s, background 0.15s;
}

.stat-card--grey   { border-left-color: #9ca3af; }
.stat-card--yellow { border-left-color: #f59e0b; }
.stat-card--blue   { border-left-color: #4f6ef7; }
.stat-card--green  { border-left-color: #10b981; }
.stat-card--red    { border-left-color: #ef4444; }

.stat-card--clickable { cursor: pointer; user-select: none; }
.stat-card--clickable:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.stat-card--active {
  background: #f5f7ff;
  box-shadow: 0 4px 12px rgba(79, 110, 247, 0.15);
  transform: translateY(-1px);
}
.stat-card--grey.stat-card--active   { background: #f9fafb; box-shadow: 0 4px 12px rgba(156, 163, 175, 0.15); }
.stat-card--yellow.stat-card--active { background: #fffbeb; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15); }
.stat-card--blue.stat-card--active   { background: #eff2ff; box-shadow: 0 4px 12px rgba(79, 110, 247, 0.15); }
.stat-card--green.stat-card--active  { background: #ecfdf5; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15); }
.stat-card--red.stat-card--active    { background: #fef2f2; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15); }

.stat-value { font-size: 28px; font-weight: 700; color: #1a1f3c; }
.stat-label { font-size: 12px; color: #6b7280; margin-top: 2px; }

@media (max-width: 768px) {
  .stats-row { gap: 10px; }
  .stat-card  { padding: 12px 16px; }
  .stat-value { font-size: 22px; }
}
</style>
