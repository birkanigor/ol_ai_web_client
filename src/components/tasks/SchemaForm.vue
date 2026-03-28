<template>
  <div class="schema-form">
    <div v-for="(prop, key) in schema.properties" :key="key" class="schema-field">

      <!-- Nested object -->
      <template v-if="prop.type === 'object'">
        <div class="schema-group">
          <div class="schema-group-header">
            <span class="schema-group-label">{{ key }}</span>
            <span v-if="isRequired(String(key))" class="required">*</span>
            <span class="label-hint">object</span>
          </div>
          <div class="schema-group-body">
            <SchemaForm
              :schema="prop"
              :model-value="(modelValue[key] as Record<string, unknown>) ?? {}"
              :disabled="disabled"
              @update:model-value="onNested(String(key), $event)"
            />
          </div>
        </div>
      </template>

      <!-- Scalar field -->
      <template v-else>
        <label :for="`sf-${path}-${key}`">
          {{ key }}
          <span v-if="isRequired(String(key))" class="required">*</span>
          <span class="label-hint">{{ prop.type }}</span>
        </label>
        <input
          :id="`sf-${path}-${key}`"
          :value="modelValue[key] ?? ''"
          :type="prop.type === 'number' ? 'number' : 'text'"
          :required="isRequired(String(key))"
          :disabled="disabled"
          :placeholder="prop.type === 'number' ? '0' : ''"
          @input="onInput(String(key), ($event.target as HTMLInputElement).value, prop.type)"
        />
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'
import type { TaskTemplateSchema } from '../../services/tasksService'

const props = defineProps({
  schema: {
    type: Object as PropType<TaskTemplateSchema>,
    required: true,
  },
  modelValue: {
    type: Object as PropType<Record<string, unknown>>,
    default: () => ({}),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  path: {
    type: String,
    default: 'root',
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: Record<string, unknown>): void
}>()

function isRequired(key: string): boolean {
  return props.schema.required?.includes(key) ?? false
}

function onInput(key: string, raw: string, type: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: type === 'number' ? (raw === '' ? '' : Number(raw)) : raw,
  })
}

function onNested(key: string, val: Record<string, unknown>) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: val,
  })
}
</script>

<style scoped>
.schema-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.schema-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

input {
  padding: 8px 12px;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #f9fafb;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}
input:focus {
  border-color: #4f6ef7;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(79, 110, 247, 0.12);
}
input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.required    { color: #ef4444; margin-left: 2px; }
.label-hint  { font-weight: 400; color: #9ca3af; font-size: 11px; margin-left: 5px; }

.schema-group {
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}
.schema-group-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}
.schema-group-label { font-size: 13px; font-weight: 700; color: #1a1f3c; }
.schema-group-body  { padding: 14px; }
</style>
