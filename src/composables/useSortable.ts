import { ref } from 'vue'

export type SortDir = 'asc' | 'desc'

/**
 * Generic client-side column sorting.
 * Usage:
 *   const { sortKey, sortDir, sortBy, applySorted } = useSortable()
 *   const sorted = computed(() => applySorted(myList.value))
 *   // In template: <th class="th-sort" :class="thClass('field')" @click="sortBy('field')">Label</th>
 */
export function useSortable() {
  const sortKey = ref('')
  const sortDir = ref<SortDir>('asc')

  function sortBy(key: string) {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = 'asc'
    }
  }

  function applySorted<T extends Record<string, unknown>>(list: T[]): T[] {
    if (!sortKey.value) return list
    const k = sortKey.value
    const dir = sortDir.value === 'asc' ? 1 : -1
    return [...list].sort((a, b) => {
      const av = a[k] ?? ''
      const bv = b[k] ?? ''
      return (
        String(av).localeCompare(String(bv), undefined, {
          numeric: true,
          sensitivity: 'base',
        }) * dir
      )
    })
  }

  /** Returns CSS classes for a sortable <th>. */
  function thClass(key: string): Record<string, boolean> {
    return {
      'th-sort--asc':  sortKey.value === key && sortDir.value === 'asc',
      'th-sort--desc': sortKey.value === key && sortDir.value === 'desc',
    }
  }

  return { sortKey, sortDir, sortBy, applySorted, thClass }
}

/**
 * Paste these styles into the <style scoped> block of any component that uses useSortable().
 *
 * .th-sort { cursor: pointer; user-select: none; white-space: nowrap; }
 * .th-sort::after { content: ' ↕'; color: #d1d5db; font-size: 10px; }
 * .th-sort--asc::after  { content: ' ↑'; color: #4f6ef7; }
 * .th-sort--desc::after { content: ' ↓'; color: #4f6ef7; }
 * .th-sort:hover { color: #374151; }
 */
