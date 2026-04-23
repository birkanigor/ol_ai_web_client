<template>
  <Teleport to="body">
    <div class="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true">

        <!-- ── Header ── -->
        <div class="modal-header">
          <div class="header-left">
            <h2>New Automation Rule</h2>
            <div class="steps">
              <div
                v-for="(label, i) in STEP_LABELS"
                :key="i"
                class="step"
                :class="{ 'step--active': step === i + 1, 'step--done': step > i + 1 }"
              >
                <span class="step-num">
                  <svg v-if="step > i + 1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  <span v-else>{{ i + 1 }}</span>
                </span>
                <span class="step-label">{{ label }}</span>
                <span v-if="i < STEP_LABELS.length - 1" class="step-sep" />
              </div>
            </div>
          </div>
          <button class="close-btn" @click="tryClose">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </button>
        </div>

        <!-- ── Body ── -->
        <div class="modal-body">

          <!-- ════ STEP 1 — Template Selection ════ -->
          <div v-if="step === 1" class="step-content">
            <p class="step-desc">Filter and select the rule template.</p>

            <!-- Entity type -->
            <div class="form-field">
              <label>Entity Type <span class="req">*</span></label>
              <div class="select-wrap">
                <select v-model="sel.entityTypeId" @change="onEntityChange">
                  <option :value="null">— Select entity type —</option>
                  <option v-for="et in entityTypes" :key="et.id" :value="et.id">{{ et.entity_name }}</option>
                </select>
              </div>
            </div>

            <!-- Category -->
            <div class="form-field" :class="{ 'form-field--dim': !sel.entityTypeId }">
              <label>Category <span class="req">*</span></label>
              <div class="select-wrap">
                <select v-model="sel.categoryId" :disabled="!sel.entityTypeId" @change="sel.templateId = null">
                  <option :value="null">— Select category —</option>
                  <option v-for="c in filteredCategories" :key="c.id" :value="c.id">{{ c.category_name }}</option>
                </select>
              </div>
            </div>

            <!-- Template cards -->
            <div class="form-field" :class="{ 'form-field--dim': !sel.categoryId }">
              <label>Template <span class="req">*</span></label>
              <div v-if="!sel.categoryId" class="empty-hint">Select a category first.</div>
              <div v-else-if="filteredTemplates.length === 0" class="empty-hint">No templates for this combination.</div>
              <div v-else class="template-grid">
                <button
                  v-for="t in filteredTemplates"
                  :key="t.id"
                  type="button"
                  class="template-card"
                  :class="{ 'template-card--selected': sel.templateId === t.id }"
                  @click="sel.templateId = t.id"
                >
                  <div class="tc-name">{{ t.template_name }}</div>
                  <div class="tc-meta">
                    <span class="tc-chip tc-chip--entity">{{ t.entity_name }}</span>
                    <span class="tc-chip tc-chip--res">{{ t.time_resolution }}m</span>
                    <span class="tc-chip" :class="`tc-chip--sev-${t.severity_level_name}`">{{ capitalize(t.severity_level_name) }}</span>
                  </div>
                  <div v-if="t.template_description" class="tc-desc">{{ t.template_description }}</div>
                </button>
              </div>
            </div>

            <span v-if="errors.step1" class="field-error">{{ errors.step1 }}</span>
          </div>

          <!-- ════ STEP 2 — Rule Details ════ -->
          <div v-if="step === 2" class="step-content">
            <p class="step-desc">Name your rule, configure its logic, and review the alarm details.</p>

            <!-- Template summary -->
            <div class="template-summary">
              <div class="ts-row"><span class="ts-label">Template</span><span class="ts-val">{{ selectedTemplate?.template_name }}</span></div>
              <div class="ts-row"><span class="ts-label">Entity</span><span class="ts-val">{{ selectedTemplate?.entity_name }}</span></div>
              <div class="ts-row"><span class="ts-label">Category</span><span class="ts-val">{{ selectedTemplate?.category_name }}</span></div>
              <div class="ts-row"><span class="ts-label">Resolution</span><span class="ts-val">{{ selectedTemplate?.time_resolution }} minutes</span></div>
              <div v-if="selectedTemplate?.example" class="ts-row">
                <span class="ts-label">Example</span><span class="ts-val ts-val--mono">{{ selectedTemplate.example }}</span>
              </div>
            </div>

            <!-- Rule name -->
            <div class="form-field mt">
              <label>Rule Name <span class="req">*</span></label>
              <input
                v-model="form.rule_name"
                type="text"
                placeholder="e.g. Device High Data Usage Alert"
                :class="{ 'input--error': errors.rule_name }"
                @input="errors.rule_name = ''"
              />
              <span v-if="errors.rule_name" class="field-error">{{ errors.rule_name }}</span>
            </div>

            <!-- ── Rule Logic ── -->
            <div v-if="conditionsLoading" class="form-field mt">
              <label>Rule Logic</label>
              <div class="cond-loading"><span class="spinner-xs" /> Loading conditions…</div>
            </div>

            <div v-else-if="hasAnyCondition" class="form-field mt">
              <label>Rule Logic <span class="req">*</span></label>

              <!-- Full statement text — always shown when additional_info exists.
                   [CONDITION_N] tokens inside it are replaced by clickable chips. -->
              <div v-if="selectedTemplate?.additional_info" class="rl-sentence">
                <template v-for="(part, idx) in conditionParts" :key="idx">
                  <span v-if="part.type === 'text'" class="rl-text">{{ part.text }}</span>
                  <button
                    v-else-if="part.type === 'condition'"
                    type="button"
                    class="rl-chip"
                    :class="{
                      'rl-chip--set':    isConditionSet(part.conditionId),
                      'rl-chip--active': activeConditionId === part.conditionId,
                    }"
                    @click="toggleCondition(part.conditionId)"
                  >
                    <span v-if="isConditionSet(part.conditionId)">{{ conditionChipLabel(part.conditionId, part.condition) }}</span>
                    <span v-else class="rl-chip__prompt">
                      <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 10.5h-1.5v-1.5h1.5v1.5zm0-3h-1.5V4.5h1.5V8.5z"/></svg>
                      configure
                    </span>
                  </button>
                </template>
              </div>

              <!-- Standalone condition list (no tokens in text) -->
              <div v-if="standaloneConditions.length > 0" class="rl-standalone-list">
                <button
                  v-for="cond in standaloneConditions"
                  :key="cond.id"
                  type="button"
                  class="rl-chip rl-chip--standalone"
                  :class="{
                    'rl-chip--set':    cond.condition_id !== null && isConditionSet(cond.condition_id),
                    'rl-chip--active': cond.condition_id !== null && activeConditionId === cond.condition_id,
                  }"
                  @click="cond.condition_id !== null && toggleCondition(cond.condition_id)"
                >
                  <span class="rl-chip__label">{{ cond.condition_text ?? cond.left_counter_name ?? `Condition ${cond.condition_id}` }}</span>
                  <span v-if="cond.condition_id !== null && isConditionSet(cond.condition_id)" class="rl-chip__val">
                    {{ conditionChipLabel(cond.condition_id, cond) }}
                  </span>
                  <span v-else class="rl-chip__prompt">
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 10.5h-1.5v-1.5h1.5v1.5zm0-3h-1.5V4.5h1.5V8.5z"/></svg>
                    click to configure
                  </span>
                </button>
              </div>

              <!-- Inline configuration panel — appears below when a chip is active -->
              <div v-if="activeCondition !== null" class="cond-panel">
                <div class="cond-panel__header">
                  <span class="cond-panel__title">
                    Configure: <em>{{ activeCondition.condition_text ?? activeCondition.left_counter_name ?? `Condition ${activeCondition.condition_id}` }}</em>
                  </span>
                  <button type="button" class="cond-panel__close" @click="activeConditionId = null">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                  </button>
                </div>
                <div class="cond-panel__body">

                  <!-- value type (condition_type = 1) -->
                  <template v-if="activeCondition.condition_type === 1 && activeConditionId !== null">
                    <div class="cond-panel__row">
                      <label class="cond-panel__lbl">Operator</label>
                      <div class="select-wrap">
                        <select v-model="conditionValues[activeConditionId].operator">
                          <option value=">">&gt; (greater than)</option>
                          <option value=">=">&gt;= (greater than or equal)</option>
                          <option value="<">&lt; (less than)</option>
                          <option value="<=">&lt;= (less than or equal)</option>
                          <option value="=">=  (equal)</option>
                        </select>
                      </div>
                    </div>
                    <div class="cond-panel__row">
                      <label class="cond-panel__lbl">
                        Value
                        <span v-if="activeCondition.unit_text" class="cond-panel__unit">({{ activeCondition.unit_text }})</span>
                      </label>
                      <input
                        v-model.number="conditionValues[activeConditionId].value"
                        type="number"
                        min="0"
                        class="cond-panel__input"
                        placeholder="e.g. 50"
                        autofocus
                      />
                    </div>
                  </template>

                  <!-- counter type (condition_type = 2) -->
                  <template v-else-if="activeCondition.condition_type === 2 && activeConditionId !== null">
                    <div class="cond-panel__row cond-panel__row--info">
                      <span class="cond-panel__lbl">Comparing</span>
                      <span class="cond-panel__counters">
                        <code>{{ activeCondition.left_counter_name }}</code>
                        <span class="cond-panel__vs">vs</span>
                        <code>{{ activeCondition.right_counter_name }}</code>
                      </span>
                    </div>
                    <div class="cond-panel__row">
                      <label class="cond-panel__lbl">Direction</label>
                      <div class="select-wrap">
                        <select v-model="conditionValues[activeConditionId].operator">
                          <option value="increases_by">Increases by</option>
                          <option value="decreases_by">Decreases by</option>
                          <option value="changes_by">Changes by</option>
                        </select>
                      </div>
                    </div>
                    <div class="cond-panel__row">
                      <label class="cond-panel__lbl">
                        Threshold
                        <span class="cond-panel__unit">({{ activeCondition.unit_type_name ?? activeCondition.unit_text }})</span>
                      </label>
                      <input
                        v-model.number="conditionValues[activeConditionId].value"
                        type="number"
                        min="0"
                        class="cond-panel__input"
                        placeholder="e.g. 30"
                        autofocus
                      />
                    </div>
                  </template>

                </div>
                <div class="cond-panel__footer">
                  <button type="button" class="btn btn--primary btn--sm" @click="activeConditionId = null">Done</button>
                </div>
              </div>

              <span v-if="errors.conditions" class="field-error mt-2">{{ errors.conditions }}</span>
            </div>

            <!-- Severity override -->
            <div class="form-field">
              <label>Severity</label>
              <div class="severity-options">
                <button
                  v-for="sv in severityLevels"
                  :key="sv.id"
                  type="button"
                  class="sev-btn"
                  :class="[`sev-btn--${sv.severity_level_name}`, { 'sev-btn--selected': form.severityNote === sv.severity_level_name }]"
                  @click="form.severityNote = sv.severity_level_name ?? ''"
                >{{ capitalize(sv.severity_level_name) }}</button>
              </div>
              <span class="hint">Template default: <strong>{{ capitalize(selectedTemplate?.severity_level_name) }}</strong> — displayed only, not saved separately.</span>
            </div>
          </div>

          <!-- ════ STEP 3 — Actions ════ -->
          <div v-if="step === 3" class="step-content">
            <p class="step-desc">Choose what happens when this rule triggers. Select one or more actions, or leave all off to do nothing.</p>

            <!-- Send Email -->
            <div class="action-card" :class="{ 'action-card--active': actions.email.enabled }">
              <div class="action-card__header" @click="actions.email.enabled = !actions.email.enabled">
                <label class="toggle" @click.stop>
                  <input type="checkbox" v-model="actions.email.enabled" />
                  <span class="toggle__track" />
                </label>
                <div class="action-card__icon action-card__icon--email">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                </div>
                <div class="action-card__info">
                  <div class="action-card__title">Send Email</div>
                  <div class="action-card__desc">Notify one or more recipients by email when the rule triggers</div>
                </div>
              </div>
              <div v-if="actions.email.enabled" class="action-card__body">
                <div class="form-field">
                  <label>Recipients <span class="req">*</span></label>
                  <div
                    class="chip-input"
                    :class="{ 'chip-input--focused': emailChipFocused, 'chip-input--error': !!errors.action_email }"
                    @click="emailChipRef?.focus()"
                  >
                    <span v-for="(addr, i) in emailChips" :key="i" class="chip">
                      {{ addr }}
                      <button type="button" class="chip-remove" @click.stop="removeEmailChip(i)">×</button>
                    </span>
                    <input
                      ref="emailChipRef"
                      v-model="emailDraft"
                      type="text"
                      placeholder="name@example.com — press Enter, comma or space"
                      @focus="emailChipFocused = true; errors.action_email = ''"
                      @blur="flushEmailDraft(); emailChipFocused = false"
                      @keydown.enter.prevent="flushEmailDraft"
                      @input="onEmailDraftInput"
                      @keydown.backspace="onEmailBackspace"
                    />
                  </div>
                  <span v-if="errors.action_email" class="field-error">{{ errors.action_email }}</span>
                </div>
                <div class="form-field">
                  <label>Subject</label>
                  <input v-model="actions.email.subject" type="text" :placeholder="form.rule_name || 'Rule name'" />
                </div>
              </div>
            </div>

            <!-- Run Script -->
            <div class="action-card" :class="{ 'action-card--active': actions.script.enabled }">
              <div class="action-card__header" @click="actions.script.enabled = !actions.script.enabled">
                <label class="toggle" @click.stop>
                  <input type="checkbox" v-model="actions.script.enabled" />
                  <span class="toggle__track" />
                </label>
                <div class="action-card__icon action-card__icon--script">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
                </div>
                <div class="action-card__info">
                  <div class="action-card__title">Run Script</div>
                  <div class="action-card__desc">Execute a server-side script when the rule triggers</div>
                </div>
              </div>
              <div v-if="actions.script.enabled" class="action-card__body">
                <div class="form-field">
                  <label>Script path <span class="req">*</span></label>
                  <input
                    v-model="actions.script.scriptPath"
                    type="text"
                    placeholder="/opt/scripts/my-alert.sh"
                    :class="{ 'input--error': errors.action_script }"
                    @input="errors.action_script = ''"
                  />
                  <span v-if="errors.action_script" class="field-error">{{ errors.action_script }}</span>
                </div>
                <div class="form-field">
                  <label>Arguments <span class="hint-inline">(optional)</span></label>
                  <input v-model="actions.script.args" type="text" placeholder="--rule {{rule_name}} --severity {{severity}}" />
                  <span class="hint">You may use <code v-pre>{{rule_name}}</code>, <code v-pre>{{severity}}</code>, <code v-pre>{{triggered_at}}</code> as placeholders.</span>
                </div>
              </div>
            </div>

            <!-- Call API -->
            <div class="action-card" :class="{ 'action-card--active': actions.api.enabled }">
              <div class="action-card__header" @click="actions.api.enabled = !actions.api.enabled">
                <label class="toggle" @click.stop>
                  <input type="checkbox" v-model="actions.api.enabled" />
                  <span class="toggle__track" />
                </label>
                <div class="action-card__icon action-card__icon--api">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                </div>
                <div class="action-card__info">
                  <div class="action-card__title">Call API</div>
                  <div class="action-card__desc">Send an HTTP request to an external endpoint when the rule triggers</div>
                </div>
              </div>
              <div v-if="actions.api.enabled" class="action-card__body">
                <div class="form-row">
                  <div class="form-field" style="flex: 0 0 110px;">
                    <label>Method</label>
                    <div class="select-wrap">
                      <select v-model="actions.api.method">
                        <option>POST</option><option>GET</option>
                        <option>PUT</option><option>PATCH</option><option>DELETE</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-field" style="flex: 1;">
                    <label>URL <span class="req">*</span></label>
                    <input
                      v-model="actions.api.url"
                      type="url"
                      placeholder="https://hooks.example.com/alert"
                      :class="{ 'input--error': errors.action_api }"
                      @input="errors.action_api = ''"
                    />
                    <span v-if="errors.action_api" class="field-error">{{ errors.action_api }}</span>
                  </div>
                </div>
                <div class="form-field">
                  <label>Request Body <span class="hint-inline">(JSON, optional)</span></label>
                  <textarea
                    v-model="actions.api.body"
                    class="api-body-input"
                    rows="3"
                    placeholder='{ "rule": "{{rule_name}}", "severity": "{{severity}}" }'
                    spellcheck="false"
                  />
                </div>
              </div>
            </div>

            <!-- Do Nothing note -->
            <p v-if="!actions.email.enabled && !actions.script.enabled && !actions.api.enabled" class="do-nothing-note">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
              No actions selected — the rule will trigger and be logged, but no notifications will be sent.
            </p>
          </div>

          <!-- ════ STEP 4 — Schedule ════ -->
          <div v-if="step === 4" class="step-content">
            <p class="step-desc">Configure when the rule runs and how far back it looks.</p>

            <!-- ── Hourly mode (60-min resolution) ── -->
            <template v-if="resolutionMode === 'hourly'">
              <div class="form-row">
                <div class="form-field">
                  <label>Run every</label>
                  <div class="select-wrap">
                    <select v-model.number="sched.everyN">
                      <option :value="5">5 minutes</option>
                      <option :value="10">10 minutes</option>
                      <option :value="15">15 minutes</option>
                      <option :value="20">20 minutes</option>
                      <option :value="30">30 minutes</option>
                      <option :value="60">Once per hour</option>
                    </select>
                  </div>
                </div>
                <div class="form-field">
                  <label>Starting from minute</label>
                  <input v-model.number="sched.startMinute" type="number" min="0" max="59" placeholder="0" />
                  <span class="hint">First run each hour will be at minute&nbsp;<strong>:{{ String(sched.startMinute ?? 0).padStart(2,'0') }}</strong></span>
                </div>
              </div>
            </template>

            <!-- ── Daily mode (1440-min resolution) ── -->
            <template v-else-if="resolutionMode === 'daily'">
              <div class="form-row">
                <div class="form-field">
                  <label>Run every</label>
                  <div class="select-wrap">
                    <select v-model.number="sched.everyNHours">
                      <option :value="1">1 hour</option>
                      <option :value="2">2 hours</option>
                      <option :value="3">3 hours</option>
                      <option :value="4">4 hours</option>
                      <option :value="6">6 hours</option>
                      <option :value="8">8 hours</option>
                      <option :value="12">12 hours</option>
                      <option :value="24">Once per day</option>
                    </select>
                  </div>
                </div>
                <div class="form-field">
                  <label>At minute</label>
                  <input v-model.number="sched.minute" type="number" min="0" max="59" placeholder="0" />
                  <span class="hint">Runs at minute&nbsp;<strong>:{{ String(sched.minute ?? 0).padStart(2,'0') }}</strong> of each scheduled hour</span>
                </div>
              </div>
            </template>

            <!-- ── Generic / custom mode ── -->
            <template v-else>
              <div class="form-field">
                <label>Frequency</label>
                <div class="select-wrap">
                  <select v-model="scheduleType">
                    <option value="minutes">Every N minutes</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom cron</option>
                  </select>
                </div>
              </div>

              <div v-if="scheduleType === 'minutes'" class="form-row">
                <div class="form-field">
                  <label>Every</label>
                  <div class="select-wrap">
                    <select v-model="sched.everyN">
                      <option v-for="n in [1,2,5,10,15,20,30]" :key="n" :value="n">{{ n }} min</option>
                    </select>
                  </div>
                </div>
              </div>
              <div v-else-if="scheduleType === 'hourly'" class="form-row">
                <div class="form-field">
                  <label>At minute</label>
                  <input v-model.number="sched.minute" type="number" min="0" max="59" placeholder="0" />
                </div>
              </div>
              <div v-else-if="scheduleType === 'daily'" class="form-row">
                <div class="form-field">
                  <label>Hour</label>
                  <input v-model.number="sched.hour" type="number" min="0" max="23" placeholder="8" />
                </div>
                <div class="form-field">
                  <label>Minute</label>
                  <input v-model.number="sched.minute" type="number" min="0" max="59" placeholder="0" />
                </div>
              </div>
              <div v-else-if="scheduleType === 'weekly'" class="form-row">
                <div class="form-field">
                  <label>Day</label>
                  <div class="select-wrap">
                    <select v-model.number="sched.weekday">
                      <option :value="1">Monday</option><option :value="2">Tuesday</option>
                      <option :value="3">Wednesday</option><option :value="4">Thursday</option>
                      <option :value="5">Friday</option><option :value="6">Saturday</option>
                      <option :value="0">Sunday</option>
                    </select>
                  </div>
                </div>
                <div class="form-field">
                  <label>Hour</label>
                  <input v-model.number="sched.hour" type="number" min="0" max="23" placeholder="8" />
                </div>
                <div class="form-field">
                  <label>Minute</label>
                  <input v-model.number="sched.minute" type="number" min="0" max="59" placeholder="0" />
                </div>
              </div>
              <div v-else-if="scheduleType === 'monthly'" class="form-row">
                <div class="form-field">
                  <label>Day of month</label>
                  <input v-model.number="sched.dayOfMonth" type="number" min="1" max="28" placeholder="1" />
                </div>
                <div class="form-field">
                  <label>Hour</label>
                  <input v-model.number="sched.hour" type="number" min="0" max="23" placeholder="8" />
                </div>
                <div class="form-field">
                  <label>Minute</label>
                  <input v-model.number="sched.minute" type="number" min="0" max="59" placeholder="0" />
                </div>
              </div>
              <div v-else-if="scheduleType === 'custom'" class="form-field">
                <label>Cron expression <span class="req">*</span></label>
                <input v-model="sched.custom" type="text" placeholder="0 8 * * *" spellcheck="false" />
                <span class="hint">Format: <code>minute hour day month weekday</code></span>
              </div>
            </template>

            <!-- ── Week-days (hourly + daily modes, and non-custom generic) ── -->
            <div v-if="resolutionMode !== 'generic' || scheduleType !== 'custom'" class="form-field">
              <label>Run on days</label>
              <div class="weekday-picker">
                <label
                  v-for="(day, idx) in WEEKDAY_LABELS"
                  :key="idx"
                  class="weekday-btn"
                  :class="{ 'weekday-btn--active': schedWeekdays.includes(idx) }"
                >
                  <input type="checkbox" :value="idx" v-model="schedWeekdays" style="display:none" />
                  {{ day }}
                </label>
              </div>
              <span class="hint">{{ weekdayDescription }}</span>
            </div>

            <!-- ── Custom cron override for smart modes ── -->
            <div v-if="resolutionMode !== 'generic'" class="form-field">
              <button type="button" class="btn-link" @click="showCustomCron = !showCustomCron">
                {{ showCustomCron ? '— Hide' : '+ Use' }} custom cron expression
              </button>
              <div v-if="showCustomCron" class="custom-cron-row">
                <input v-model="sched.custom" type="text" placeholder="0 8 * * *" spellcheck="false" />
                <span class="hint">Format: <code>minute hour day month weekday</code></span>
              </div>
            </div>

            <!-- Cron preview -->
            <div class="cron-preview">
              <span class="cron-preview__label">Schedule:</span>
              <code class="cron-preview__value">{{ cronExpression }}</code>
              <span class="cron-preview__desc">{{ cronDescription }}</span>
            </div>

            <!-- Completion intervals -->
            <div class="form-field">
              <label>Look-back intervals <span class="req">*</span></label>
              <input
                v-model.number="form.completion_intervals"
                type="number"
                min="1"
                max="100"
                placeholder="3"
                :class="{ 'input--error': errors.completion_intervals }"
                @input="errors.completion_intervals = ''"
              />
              <span class="hint">
                Number of <strong>{{ selectedTemplate?.time_resolution ?? '?' }}-minute</strong> intervals
                the rule evaluates (e.g. 3 → last {{ (form.completion_intervals || 3) * (selectedTemplate?.time_resolution ?? 60) }} minutes).
              </span>
              <span v-if="errors.completion_intervals" class="field-error">{{ errors.completion_intervals }}</span>
            </div>

            <!-- Additional Definitions -->
            <div class="defs-card">
              <div class="defs-card__title">Additional Definitions</div>

              <!-- Include last appearance -->
              <div class="defs-row">
                <label class="toggle">
                  <input type="checkbox" v-model="form.include_last_appearance" />
                  <span class="toggle__track" />
                </label>
                <div class="defs-row__info">
                  <span class="defs-row__label">Include last appearance</span>
                  <span class="defs-row__desc">The most recent (possibly incomplete) interval is included in evaluation alongside completed intervals.</span>
                </div>
              </div>

              <!-- Appearances counter -->
              <div class="defs-row defs-row--top">
                <label class="toggle">
                  <input type="checkbox" v-model="form.appearances_counter_enabled" />
                  <span class="toggle__track" />
                </label>
                <div class="defs-row__info">
                  <span class="defs-row__label">Appearances counter</span>
                  <span class="defs-row__desc">Only trigger the rule when the condition appears a minimum number of times within a recent window.</span>
                  <div v-if="form.appearances_counter_enabled" class="appearances-row">
                    <span class="appearances-text">Trigger when condition appears at least</span>
                    <input
                      v-model.number="form.min_appearances"
                      type="number" min="1" :max="form.appearances_window"
                      class="appearances-input"
                      :class="{ 'input--error': errors.min_appearances }"
                      @input="errors.min_appearances = ''"
                    />
                    <span class="appearances-text">time(s) in the last</span>
                    <input
                      v-model.number="form.appearances_window"
                      type="number" min="1" :max="form.completion_intervals || 100"
                      class="appearances-input"
                      :class="{ 'input--error': errors.appearances_window }"
                      @input="errors.appearances_window = ''"
                    />
                    <span class="appearances-text">timestamp(s)</span>
                    <span v-if="errors.min_appearances || errors.appearances_window" class="field-error appearances-err">
                      {{ errors.min_appearances || errors.appearances_window }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ════ STEP 5 — Review & Confirm ════ -->
          <div v-if="step === 5" class="step-content">
            <p class="step-desc">Review your rule before creating it.</p>
            <div class="review-card">
              <div class="review-row">
                <span class="review-label">Rule Name</span>
                <span class="review-val review-val--bold">{{ form.rule_name }}</span>
              </div>
              <div v-if="ruleLogicSummary" class="review-row">
                <span class="review-label">Rule Logic</span>
                <span class="review-val review-val--logic">{{ ruleLogicSummary }}</span>
              </div>
              <div class="review-row">
                <span class="review-label">Template</span>
                <span class="review-val">{{ selectedTemplate?.template_name }}</span>
              </div>
              <div class="review-row">
                <span class="review-label">Entity Type</span>
                <span class="review-val">{{ selectedTemplate?.entity_name }}</span>
              </div>
              <div class="review-row">
                <span class="review-label">Category</span>
                <span class="review-val">{{ selectedTemplate?.category_name }}</span>
              </div>
              <div class="review-row">
                <span class="review-label">Severity</span>
                <span class="review-val">
                  <span class="severity-badge" :class="`severity-badge--${selectedTemplate?.severity_level_name}`">
                    {{ capitalize(selectedTemplate?.severity_level_name) }}
                  </span>
                </span>
              </div>
              <div class="review-row">
                <span class="review-label">Schedule</span>
                <span class="review-val review-val--mono">{{ cronExpression }}</span>
              </div>
              <div class="review-row">
                <span class="review-label">Description</span>
                <span class="review-val">{{ cronDescription }}</span>
              </div>
              <div class="review-row">
                <span class="review-label">Look-back</span>
                <span class="review-val">
                  {{ form.completion_intervals }} interval{{ form.completion_intervals !== 1 ? 's' : '' }}
                  ({{ form.completion_intervals * (selectedTemplate?.time_resolution ?? 60) }} min)
                </span>
              </div>
              <div class="review-row">
                <span class="review-label">Last appearance</span>
                <span class="review-val">{{ form.include_last_appearance ? 'Included' : 'Excluded' }}</span>
              </div>
              <div v-if="form.appearances_counter_enabled" class="review-row">
                <span class="review-label">Appearances</span>
                <span class="review-val">At least {{ form.min_appearances }} in last {{ form.appearances_window }} timestamp{{ form.appearances_window !== 1 ? 's' : '' }}</span>
              </div>
              <div class="review-row">
                <span class="review-label">Actions</span>
                <span class="review-val">
                  <span v-if="!actions.email.enabled && !actions.script.enabled && !actions.api.enabled" class="review-actions-none">None (log only)</span>
                  <span v-else class="review-actions-list">
                    <span v-if="actions.email.enabled" class="review-action-chip review-action-chip--email">
                      <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                      Email
                    </span>
                    <span v-if="actions.script.enabled" class="review-action-chip review-action-chip--script">
                      <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
                      Script
                    </span>
                    <span v-if="actions.api.enabled" class="review-action-chip review-action-chip--api">
                      <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                      API
                    </span>
                  </span>
                </span>
              </div>
              <div class="review-row">
                <span class="review-label">Status</span>
                <span class="review-val">
                  <span class="status-pill status-pill--active"><span class="status-dot"/>Active</span>
                </span>
              </div>
            </div>
          </div>

        </div>

        <!-- ── Footer ── -->
        <div class="modal-footer">
          <button class="btn btn--ghost" :disabled="submitting" @click="tryClose">Cancel</button>
          <div class="footer-nav">
            <button v-if="step > 1" class="btn btn--ghost" :disabled="submitting" @click="step--">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              Back
            </button>
            <button v-if="step < 5" class="btn btn--primary" @click="nextStep">
              Next
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
            </button>
            <button v-else class="btn btn--success" :disabled="submitting" @click="submit">
              <span v-if="submitting" class="spinner-sm" />
              <svg v-else viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              {{ submitting ? 'Creating…' : 'Create Rule' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  getTemplates, getSeverityLevels, getTemplateConditions, addRule,
  type AutomationTemplate, type SeverityLevel, type TemplateCondition, type ConditionValue,
} from '../../services/automationsService'
import { useToast } from '../../composables/useToast'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const toast = useToast()

const STEP_LABELS = ['Template', 'Details', 'Actions', 'Schedule', 'Confirm']

// ── Loading ───────────────────────────────────────────────────────────────
const allTemplates   = ref<AutomationTemplate[]>([])
const severityLevels = ref<SeverityLevel[]>([])

onMounted(async () => {
  try {
    const [tmpl, sv] = await Promise.all([getTemplates(), getSeverityLevels()])
    allTemplates.value   = tmpl
    severityLevels.value = sv
  } catch {
    toast.error('Failed to load template data.')
  }
})

// ── Step 1 selections ────────────────────────────────────────────────────
const sel = reactive<{ entityTypeId: number | null; categoryId: number | null; templateId: number | null }>({
  entityTypeId: null,
  categoryId:   null,
  templateId:   null,
})

function onEntityChange() {
  sel.categoryId  = null
  sel.templateId  = null
}

const entityTypes = computed(() => {
  const seen = new Map<number, string>()
  allTemplates.value.forEach(t => {
    if (t.entity_type_id !== null && t.entity_name) seen.set(t.entity_type_id, t.entity_name)
  })
  return Array.from(seen.entries()).map(([id, entity_name]) => ({ id, entity_name }))
})

const filteredCategories = computed(() => {
  const seen = new Map<number, string>()
  allTemplates.value
    .filter(t => t.entity_type_id === sel.entityTypeId)
    .forEach(t => { if (t.category_id !== null && t.category_name) seen.set(t.category_id, t.category_name) })
  return Array.from(seen.entries()).map(([id, category_name]) => ({ id, category_name }))
})

const filteredTemplates = computed(() =>
  allTemplates.value.filter(t =>
    t.entity_type_id === sel.entityTypeId && t.category_id === sel.categoryId,
  ),
)

const selectedTemplate = computed<AutomationTemplate | null>(() =>
  allTemplates.value.find(t => t.id === sel.templateId) ?? null,
)

// ── Step 2 conditions ─────────────────────────────────────────────────────
const templateConditions = ref<TemplateCondition[]>([])
const conditionsLoading  = ref(false)
const conditionValues    = reactive<Record<number, ConditionValue>>({})

type ConditionPartText = { type: 'text'; text: string }
type ConditionPartWidget = { type: 'condition'; conditionId: number; condition: TemplateCondition | null }
type ConditionPart = ConditionPartText | ConditionPartWidget

const conditionParts = computed<ConditionPart[]>(() => {
  const text = selectedTemplate.value?.additional_info ?? ''
  if (!text) return []
  const parts: ConditionPart[] = []
  const regex = /\[CONDITION_(\d+)\]/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex)
      parts.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    const condIdNum = parseInt(match[1], 10)
    parts.push({
      type: 'condition',
      conditionId: condIdNum,
      condition: templateConditions.value.find(c => c.condition_id === condIdNum) ?? null,
    })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) parts.push({ type: 'text', text: text.slice(lastIndex) })
  return parts
})

// Conditions that appear as inline widgets inside the sentence
const visibleConditionWidgets = computed(() =>
  conditionParts.value.filter((p): p is ConditionPartWidget => p.type === 'condition' && p.condition !== null),
)

// Conditions that exist in the DB but have NO [CONDITION_N] token in the text →
// displayed as standalone form cards below the sentence (or as the whole logic section
// when alarm_additional_info is empty / null).
const standaloneConditions = computed(() =>
  templateConditions.value.filter(
    c => c.condition_id !== null &&
      !conditionParts.value.some(p => p.type === 'condition' && p.conditionId === c.condition_id),
  ),
)

// True when there is anything to show in the Rule Logic section:
// • the template has descriptive text (additional_info), OR
// • there are inline / standalone condition widgets to configure
const hasAnyCondition = computed(() =>
  !!selectedTemplate.value?.additional_info ||
  visibleConditionWidgets.value.length > 0 ||
  standaloneConditions.value.length > 0,
)

// ── Active condition panel ────────────────────────────────────────────────
const activeConditionId = ref<number | null>(null)

const activeCondition = computed<TemplateCondition | null>(() => {
  if (activeConditionId.value === null) return null
  return templateConditions.value.find(c => c.condition_id === activeConditionId.value) ?? null
})

function toggleCondition(conditionId: number) {
  activeConditionId.value = activeConditionId.value === conditionId ? null : conditionId
}

function isConditionSet(conditionId: number): boolean {
  const v = conditionValues[conditionId]
  return v !== undefined && v.value !== null && v.value !== undefined && v.value !== ('' as unknown)
}

/** Short label shown inside a configured chip, e.g. "> 50 sessions" */
function conditionChipLabel(conditionId: number, condition: TemplateCondition | null): string {
  const v = conditionValues[conditionId]
  if (!v || !condition) return ''
  if (condition.condition_type === 1) {
    return `${v.operator} ${v.value} ${condition.unit_text ?? ''}`.trim()
  }
  if (condition.condition_type === 2) {
    const dir = v.operator.replace(/_/g, ' ')
    return `${dir} ${v.value} ${condition.unit_type_name ?? condition.unit_text ?? ''}`.trim()
  }
  return String(v.value ?? '')
}

// Reset active panel when conditions list changes (template switch)
watch(templateConditions, () => { activeConditionId.value = null })

// Build a human-readable summary of the configured rule logic (used in Review step)
const ruleLogicSummary = computed((): string => {
  const text = selectedTemplate.value?.additional_info ?? ''
  if (!text || templateConditions.value.length === 0) return text
  let result = text
  templateConditions.value.forEach(c => {
    if (c.condition_id === null) return
    const val = conditionValues[c.condition_id]
    if (!val) return
    let replacement = ''
    if (c.condition_type === 1) {
      replacement = `${val.operator} ${val.value ?? '?'} ${c.unit_text ?? ''}`.trim()
    } else if (c.condition_type === 2) {
      const dir = val.operator.replace(/_/g, ' ')
      replacement = `${c.left_counter_name} ${dir} ${val.value ?? '?'} ${c.unit_type_name ?? c.unit_text ?? ''} vs ${c.right_counter_name}`.trim()
    }
    result = result.replace(`[CONDITION_${c.condition_id}]`, replacement)
  })
  return result
})

// When the conditions list changes: add entries for NEW conditions only,
// never overwrite values the user has already set.
watch(templateConditions, (conditions) => {
  // Remove stale keys that no longer exist in the list
  const validIds = new Set(conditions.map(c => c.condition_id).filter((id): id is number => id !== null))
  Object.keys(conditionValues).forEach(k => { if (!validIds.has(+k)) delete conditionValues[+k] })
  // Add missing entries — skip if a value already exists
  conditions.forEach(c => {
    if (c.condition_id !== null && !(c.condition_id in conditionValues)) {
      conditionValues[c.condition_id] = {
        operator: c.condition_type === 2 ? 'increases_by' : '>',
        value: null,
      }
    }
  })
})

// ── Step 2 form ──────────────────────────────────────────────────────────
const form = reactive({
  rule_name:                    '',
  severityNote:                 '',
  completion_intervals:         3,
  include_last_appearance:      false,
  appearances_counter_enabled:  false,
  min_appearances:              1,
  appearances_window:           3,
})

// ── Step 4 schedule ──────────────────────────────────────────────────────
type ScheduleType = 'minutes' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'
const scheduleType = ref<ScheduleType>('daily')
const sched = reactive({
  everyN:      5,    // hourly mode: interval in minutes
  startMinute: 0,    // hourly mode: starting minute
  everyNHours: 4,    // daily mode: interval in hours
  minute:      0,    // daily mode / generic: at-minute
  hour:        8,
  weekday:     1,
  dayOfMonth:  1,
  custom:      '0 8 * * *',
})
// 0=Sun 1=Mon … 6=Sat — default all 7 days
const schedWeekdays  = ref<number[]>([0, 1, 2, 3, 4, 5, 6])
const showCustomCron = ref(false)

const WEEKDAY_LABELS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAY_FULL    = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Detects display mode from the selected template's time_resolution */
const resolutionMode = computed((): 'hourly' | 'daily' | 'generic' => {
  const res = selectedTemplate.value?.time_resolution
  if (res === 60)   return 'hourly'
  if (res === 1440) return 'daily'
  return 'generic'
})

/** cron weekday segment — '*' when all 7 selected, otherwise sorted list */
const weekdaysCron = computed((): string => {
  const days = [...schedWeekdays.value].sort((a, b) => a - b)
  if (days.length === 0 || days.length === 7) return '*'
  return days.join(',')
})

/** Human-readable weekday description */
const weekdayDescription = computed((): string => {
  const days = [...schedWeekdays.value].sort((a, b) => a - b)
  if (days.length === 0)  return 'Never (no days selected)'
  if (days.length === 7)  return 'Every day'
  if (JSON.stringify(days) === JSON.stringify([1,2,3,4,5])) return 'Weekdays (Mon–Fri)'
  if (JSON.stringify(days) === JSON.stringify([0,6]))        return 'Weekends (Sat & Sun)'
  return days.map(d => WEEKDAY_FULL[d]).join(', ')
})

const cronExpression = computed((): string => {
  // Custom cron override always wins
  if (showCustomCron.value && sched.custom) return sched.custom

  const wdays = weekdaysCron.value
  const m  = sched.minute      ?? 0
  const sm = sched.startMinute ?? 0
  const n  = sched.everyN      || 5
  const nh = sched.everyNHours || 4

  if (resolutionMode.value === 'hourly') {
    // every N minutes from startMinute within each hour
    if (n >= 60) return `${sm} * * * ${wdays}`     // once per hour
    if (sm === 0) return `*/${n} * * * ${wdays}`
    return `${sm}-59/${n} * * * ${wdays}`
  }
  if (resolutionMode.value === 'daily') {
    // every N hours at minute m
    if (nh >= 24) return `${m} 0 * * ${wdays}`
    if (nh === 1) return `${m} * * * ${wdays}`
    return `${m} */${nh} * * ${wdays}`
  }
  // Generic mode
  const h  = sched.hour       ?? 8
  const wd = sched.weekday    ?? 1
  const d  = sched.dayOfMonth ?? 1
  switch (scheduleType.value) {
    case 'minutes': return `*/${sched.everyN} * * * ${wdays}`
    case 'hourly':  return `${m} * * * ${wdays}`
    case 'daily':   return `${m} ${h} * * ${wdays}`
    case 'weekly':  return `${m} ${h} * * ${wd}`
    case 'monthly': return `${m} ${h} ${d} * *`
    case 'custom':  return sched.custom || '0 8 * * *'
  }
})

const pad = (n: number) => String(n).padStart(2, '0')
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const cronDescription = computed((): string => {
  if (showCustomCron.value && sched.custom) return 'Custom schedule'

  const wdLabel = weekdayDescription.value
  const m  = sched.minute      ?? 0
  const sm = sched.startMinute ?? 0
  const n  = sched.everyN      || 5
  const nh = sched.everyNHours || 4

  if (resolutionMode.value === 'hourly') {
    const runLabel = n >= 60
      ? `Once per hour at :${pad(sm)}`
      : `Every ${n} min starting :${pad(sm)}`
    return `${runLabel} — ${wdLabel}`
  }
  if (resolutionMode.value === 'daily') {
    const runLabel = nh >= 24
      ? `Once per day at :${pad(m)}`
      : `Every ${nh}h at :${pad(m)}`
    return `${runLabel} — ${wdLabel}`
  }
  const h  = sched.hour    ?? 8
  const wd = sched.weekday ?? 1
  const d  = sched.dayOfMonth ?? 1
  switch (scheduleType.value) {
    case 'minutes': return `Every ${sched.everyN} minute(s) — ${wdLabel}`
    case 'hourly':  return `Every hour at :${pad(m)} — ${wdLabel}`
    case 'daily':   return `Every day at ${pad(h)}:${pad(m)} — ${wdLabel}`
    case 'weekly':  return `Every ${DAY_NAMES[wd]} at ${pad(h)}:${pad(m)}`
    case 'monthly': return `On day ${d} of every month at ${pad(h)}:${pad(m)}`
    case 'custom':  return 'Custom schedule'
  }
})

// ── Wizard navigation ────────────────────────────────────────────────────
const step   = ref(1)
const errors = reactive<Record<string, string>>({ step1: '', rule_name: '', conditions: '', completion_intervals: '', action_email: '', action_script: '', action_api: '', min_appearances: '', appearances_window: '' })

// ── Step 3 — Actions ─────────────────────────────────────────────────────
const actions = reactive({
  email: {
    enabled: false,
    subject: '',
  },
  script: {
    enabled: false,
    scriptPath: '',
    args: '',
  },
  api: {
    enabled: false,
    method: 'POST' as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: '',
    body: '',
  },
})

// Email chip input
const EMAIL_RE       = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const emailChips     = ref<string[]>([])
const emailDraft     = ref('')
const emailChipFocused = ref(false)
const emailChipRef   = ref<HTMLInputElement | null>(null)

function tryAddEmailChip(raw: string): boolean {
  const addr = raw.trim()
  if (!addr) return true
  if (!EMAIL_RE.test(addr)) {
    errors.action_email = `"${addr}" is not a valid email address`
    return false
  }
  if (!emailChips.value.includes(addr)) emailChips.value.push(addr)
  errors.action_email = ''
  return true
}

function onEmailDraftInput() {
  const val = emailDraft.value
  if (/[,\s]/.test(val)) {
    const parts = val.split(/[,\s]+/)
    const tail  = parts.pop() ?? ''
    for (const part of parts) tryAddEmailChip(part)
    emailDraft.value = tail
  }
}

function flushEmailDraft() {
  const parts = emailDraft.value.split(/[,\s]+/).filter(Boolean)
  const invalid: string[] = []
  for (const part of parts) {
    if (!tryAddEmailChip(part)) invalid.push(part)
  }
  emailDraft.value = invalid.join(', ')
}

function removeEmailChip(i: number) {
  emailChips.value.splice(i, 1)
}

function onEmailBackspace() {
  if (emailDraft.value === '' && emailChips.value.length) {
    emailChips.value.pop()
    emailChipRef.value?.focus()
  }
}

// Pre-fill email subject with rule name when email action is first enabled
watch(() => actions.email.enabled, (enabled) => {
  if (enabled && !actions.email.subject.trim()) {
    actions.email.subject = form.rule_name
  }
})

// Keep email subject in sync if rule name changes while email is enabled but subject still matches
watch(() => form.rule_name, (newName) => {
  if (actions.email.enabled && actions.email.subject === form.rule_name) {
    actions.email.subject = newName
  }
})

// Track which template's conditions have already been loaded so
// navigating Back → Details does not re-fetch (and wipe) the user's input.
const loadedTemplateId = ref<number | null>(null)

// When the user picks a different template in Step 1, clear everything.
watch(() => sel.templateId, (newId) => {
  if (newId !== loadedTemplateId.value) {
    loadedTemplateId.value = null
    templateConditions.value = []
    activeConditionId.value = null
    Object.keys(conditionValues).forEach(k => { delete conditionValues[+k] })
  }
})

// Fetch conditions the first time the user reaches Step 2 for a given template.
// If they navigate Back and return, the already-loaded list (and user values) are kept.
watch(step, async (newStep) => {
  if (newStep === 2 && sel.templateId && sel.templateId !== loadedTemplateId.value) {
    loadedTemplateId.value = sel.templateId
    conditionsLoading.value = true
    try {
      templateConditions.value = await getTemplateConditions(sel.templateId)
    } catch {
      toast.error('Failed to load rule conditions.')
      templateConditions.value = []
      loadedTemplateId.value = null   // allow retry on next visit
    } finally {
      conditionsLoading.value = false
    }
  }
})

function nextStep() {
  if (step.value === 1) {
    if (!sel.entityTypeId || !sel.categoryId || !sel.templateId) {
      errors.step1 = 'Please select an entity type, category, and template.'
      return
    }
    errors.step1 = ''
  }
  if (step.value === 2) {
    if (!form.rule_name.trim()) {
      errors.rule_name = 'Rule name is required.'
      return
    }
    errors.rule_name = ''
    // Only validate conditions that are actually visible to the user
    const allVisibleIds = [
      ...visibleConditionWidgets.value.map(p => p.conditionId),
      ...standaloneConditions.value.map(c => c.condition_id!),
    ]
    const missingValue = allVisibleIds.some(id => conditionValues[id]?.value == null)
    if (missingValue) {
      errors.conditions = 'Please fill in all condition values before continuing.'
      return
    }
    errors.conditions = ''
  }
  if (step.value === 3) {
    // Validate each enabled action
    let valid = true
    if (actions.email.enabled) {
      flushEmailDraft()
      if (emailChips.value.length === 0) {
        errors.action_email = 'At least one recipient is required.'
        valid = false
      } else {
        errors.action_email = ''
      }
    } else {
      errors.action_email = ''
    }
    if (actions.script.enabled && !actions.script.scriptPath.trim()) {
      errors.action_script = 'Script path is required.'
      valid = false
    } else {
      errors.action_script = ''
    }
    if (actions.api.enabled && !actions.api.url.trim()) {
      errors.action_api = 'URL is required.'
      valid = false
    } else {
      errors.action_api = ''
    }
    if (!valid) return
  }
  if (step.value === 4) {
    if (!form.completion_intervals || form.completion_intervals < 1) {
      errors.completion_intervals = 'Must be at least 1.'
      return
    }
    errors.completion_intervals = ''
    if (form.appearances_counter_enabled) {
      if (!form.min_appearances || form.min_appearances < 1) {
        errors.min_appearances = 'Must be at least 1.'
        return
      }
      if (!form.appearances_window || form.appearances_window < 1) {
        errors.appearances_window = 'Must be at least 1.'
        return
      }
      if (form.min_appearances > form.appearances_window) {
        errors.min_appearances = `Cannot exceed the window size (${form.appearances_window}).`
        return
      }
      errors.min_appearances = ''
      errors.appearances_window = ''
    }
  }
  step.value++
}

function capitalize(s: string | null | undefined): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function tryClose() {
  if (!submitting.value) emit('close')
}

// ── Submit ────────────────────────────────────────────────────────────────
const submitting = ref(false)

async function submit() {
  submitting.value = true
  try {
    // Build actions payload — include only enabled actions
    const actionsPayload: Record<string, unknown> = {}
    if (actions.email.enabled) {
      actionsPayload.email = {
        recipients: [...emailChips.value],
        subject: actions.email.subject.trim() || undefined,
      }
    }
    if (actions.script.enabled) {
      actionsPayload.script = {
        path: actions.script.scriptPath.trim(),
        args: actions.script.args.trim() || undefined,
      }
    }
    if (actions.api.enabled) {
      actionsPayload.api = {
        method: actions.api.method,
        url: actions.api.url.trim(),
        body: actions.api.body.trim() || undefined,
      }
    }

    await addRule({
      rule_name:                   form.rule_name.trim(),
      template_id:                 sel.templateId!,
      completion_intervals:        form.completion_intervals,
      rule_scheduler:              cronExpression.value,
      status_id:                   1,
      include_last_appearance:     form.include_last_appearance,
      min_appearances:             form.appearances_counter_enabled ? form.min_appearances : undefined,
      appearances_window:          form.appearances_counter_enabled ? form.appearances_window : undefined,
      condition_values:            Object.keys(conditionValues).length > 0
        ? Object.fromEntries(Object.entries(conditionValues))
        : undefined,
      actions: Object.keys(actionsPayload).length > 0 ? actionsPayload : undefined,
    })
    toast.success(`Rule "${form.rule_name}" created successfully.`)
    emit('created')
    emit('close')
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg ?? 'Failed to create rule.')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* ── Backdrop & modal ── */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.modal {
  background: #fff; border-radius: 18px;
  width: 100%; max-width: 860px; max-height: 92vh;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 72px rgba(0,0,0,0.22);
}

/* ── Header ── */
.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 28px 32px 0; gap: 16px;
}
.header-left { display: flex; flex-direction: column; gap: 18px; flex: 1; }
.modal-header h2 { font-size: 20px; font-weight: 700; color: #111827; margin: 0; }
.close-btn {
  width: 30px; height: 30px; flex-shrink: 0; margin-top: 2px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; border-radius: 6px;
  cursor: pointer; color: #6b7280;
}
.close-btn:hover { background: #f3f4f6; }
.close-btn svg { width: 18px; height: 18px; }

/* ── Step indicators ── */
.steps {
  display: flex; align-items: center; gap: 0;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}
.step { display: flex; align-items: center; gap: 8px; }
.step-num {
  width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  background: #f3f4f6; color: #9ca3af; flex-shrink: 0;
  transition: background 0.2s, color 0.2s;
}
.step-num svg { width: 13px; height: 13px; }
.step--active .step-num { background: #4f6ef7; color: #fff; }
.step--done   .step-num { background: #10b981; color: #fff; }
.step-label { font-size: 13px; font-weight: 600; color: #9ca3af; white-space: nowrap; }
.step--active .step-label { color: #4f6ef7; }
.step--done   .step-label { color: #10b981; }
.step-sep {
  width: 32px; height: 1px; background: #e5e7eb; margin: 0 6px; flex-shrink: 0;
}

/* ── Body ── */
.modal-body {
  padding: 28px 32px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.step-desc { font-size: 14px; color: #6b7280; margin: 0; }

/* Each step is a flex column — gap drives all vertical spacing between fields */
.step-content {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* ── Form fields ── */
.form-field { display: flex; flex-direction: column; gap: 8px; }
.form-field--dim { opacity: 0.5; pointer-events: none; }
.form-field.mt { margin-top: 0; } /* gap handles it now */
.form-field label {
  font-size: 12px; font-weight: 700; color: #374151;
  text-transform: uppercase; letter-spacing: .4px;
}
.req { color: #ef4444; }
.form-field input {
  padding: 10px 13px; border: 1.5px solid #d1d5db; border-radius: 8px;
  font-size: 14px; color: #111827; background: #fff; outline: none;
  transition: border-color 0.15s; box-sizing: border-box; width: 100%;
}
.form-field input:focus { border-color: #4f6ef7; }
.input--error { border-color: #ef4444 !important; }

.select-wrap { position: relative; }
.select-wrap select {
  width: 100%; padding: 10px 32px 10px 13px; appearance: none;
  border: 1.5px solid #d1d5db; border-radius: 8px;
  font-size: 14px; color: #111827; background: #fff; outline: none; cursor: pointer;
  transition: border-color 0.15s;
}
.select-wrap select:focus { border-color: #4f6ef7; }
.select-wrap::after {
  content: ''; position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  border: 5px solid transparent; border-top-color: #9ca3af; pointer-events: none;
}
.select-wrap select:disabled { background: #f9fafb; color: #9ca3af; }

.form-row { display: flex; gap: 18px; flex-wrap: wrap; }
.form-row .form-field { flex: 1; min-width: 140px; }

.hint { font-size: 12px; color: #9ca3af; margin-top: 2px; }
.hint code { font-family: monospace; background: #f3f4f6; padding: 1px 4px; border-radius: 3px; }
.field-error { font-size: 12px; color: #dc2626; }
.empty-hint { font-size: 14px; color: #9ca3af; font-style: italic; padding: 8px 0; }

/* ── Template cards ── */
.template-grid { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
.template-card {
  display: block; text-align: left; width: 100%;
  border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 16px 18px;
  background: #fff; cursor: pointer; transition: border-color 0.15s, background 0.15s;
}
.template-card:hover { border-color: #4f6ef7; background: #fafbff; }
.template-card--selected { border-color: #4f6ef7; background: #eff2ff; }
.tc-name { font-size: 15px; font-weight: 600; color: #1a1f3c; margin-bottom: 7px; }
.tc-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 7px; }
.tc-chip {
  font-size: 11px; font-weight: 600; border-radius: 5px;
  padding: 2px 7px; background: #f3f4f6; color: #6b7280;
}
.tc-chip--entity  { background: #eff2ff; color: #4f6ef7; }
.tc-chip--res     { background: #f0fdf4; color: #059669; }
.tc-chip--sev-warning  { background: #fffbeb; color: #d97706; }
.tc-chip--sev-minor    { background: #eff6ff; color: #2563eb; }
.tc-chip--sev-major    { background: #fff7ed; color: #ea580c; }
.tc-chip--sev-critical { background: #fef2f2; color: #dc2626; }
.tc-desc { font-size: 12px; color: #6b7280; }

/* ── Info banner ── */
.info-banner {
  display: flex; gap: 10px; align-items: flex-start;
  background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px;
  padding: 12px 14px;
}
.info-icon { width: 18px; height: 18px; color: #2563eb; flex-shrink: 0; margin-top: 1px; }
.info-title { font-size: 12px; font-weight: 700; color: #1e40af; margin-bottom: 2px; }
.info-text { font-size: 13px; color: #1d4ed8; line-height: 1.4; }

/* ── Template summary ── */
.template-summary {
  background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px;
  padding: 16px 20px; display: flex; flex-direction: column; gap: 10px;
}
.ts-row { display: flex; gap: 14px; align-items: baseline; }
.ts-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .4px; min-width: 90px; }
.ts-val { font-size: 14px; color: #374151; }
.ts-val--mono { font-family: monospace; font-size: 13px; }

/* ── Severity options ── */
.severity-options { display: flex; gap: 10px; flex-wrap: wrap; }
.sev-btn {
  padding: 8px 18px; border-radius: 9px; font-size: 14px; font-weight: 600;
  border: 1.5px solid transparent; cursor: pointer;
  transition: all 0.15s; background: #f3f4f6; color: #6b7280;
}
.sev-btn--warning  { background: #fffbeb; color: #d97706; border-color: #fde68a; }
.sev-btn--minor    { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
.sev-btn--major    { background: #fff7ed; color: #ea580c; border-color: #fed7aa; }
.sev-btn--critical { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
.sev-btn--selected { box-shadow: 0 0 0 2px #4f6ef7; }

/* ── Cron preview ── */
.cron-preview {
  display: flex; align-items: center; gap: 10px;
  margin-top: 8px; padding: 12px 16px;
  background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 9px; flex-wrap: wrap;
}
.cron-preview__label { font-size: 12px; color: #6b7280; font-weight: 600; }
.cron-preview__value {
  font-family: 'Courier New', monospace; font-size: 14px; font-weight: 700;
  color: #4f6ef7; background: #eff2ff; padding: 3px 10px; border-radius: 6px;
}
.cron-preview__desc { font-size: 13px; color: #374151; margin-left: 4px; }

/* ── Review card ── */
.review-card {
  border: 1.5px solid #e5e7eb; border-radius: 12px; overflow: hidden;
}
.review-row {
  display: flex; align-items: baseline; gap: 16px;
  padding: 14px 20px; border-bottom: 1px solid #f3f4f6;
}
.review-row:last-child { border-bottom: none; }
.review-row:nth-child(even) { background: #fafafa; }
.review-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .4px; min-width: 110px; }
.review-val { font-size: 14px; color: #374151; }
.review-val--bold { font-weight: 700; color: #111827; }
.review-val--mono { font-family: monospace; font-size: 13px; }

/* ── Status / severity badges (review step) ── */
.status-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 500; }
.status-dot  { width: 8px; height: 8px; border-radius: 50%; background: #d1d5db; flex-shrink: 0; }
.status-pill--active .status-dot { background: #10b981; }
.status-pill--active { color: #059669; }
.severity-badge {
  display: inline-flex; align-items: center;
  font-size: 13px; font-weight: 600; border-radius: 6px; padding: 4px 10px;
}
.severity-badge--warning  { background: #fffbeb; color: #d97706; }
.severity-badge--minor    { background: #eff6ff; color: #2563eb; }
.severity-badge--major    { background: #fff7ed; color: #ea580c; }
.severity-badge--critical { background: #fef2f2; color: #dc2626; }

/* ── Footer ── */
.modal-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 32px; border-top: 1px solid #e5e7eb; gap: 12px;
}
.footer-nav { display: flex; gap: 12px; }
.btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 11px 22px; border-radius: 9px; font-size: 14px; font-weight: 600;
  cursor: pointer; border: none; transition: background 0.15s, opacity 0.15s;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn svg { width: 16px; height: 16px; }
.btn--ghost   { background: #f3f4f6; color: #374151; }
.btn--ghost:hover:not(:disabled)   { background: #e5e7eb; }
.btn--primary { background: #4f6ef7; color: #fff; }
.btn--primary:hover:not(:disabled) { background: #3b56e0; }
.btn--success { background: #059669; color: #fff; }
.btn--success:hover:not(:disabled) { background: #047857; }

.spinner-sm {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Rule Logic ── */
.cond-loading {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: #6b7280; padding: 8px 0;
}
.spinner-xs {
  display: inline-block; width: 13px; height: 13px;
  border: 2px solid #e5e7eb; border-top-color: #4f6ef7;
  border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0;
}

/* Sentence text with inline chips — renders as a flowing paragraph */
.rl-sentence {
  background: #f8fafc; border: 1.5px solid #e5e7eb; border-radius: 10px;
  padding: 14px 16px; line-height: 2.6; font-size: 14px; color: #374151;
  /* children flow inline so text and chips sit on the same line */
}
.rl-sentence > * { display: inline; }
.rl-text { white-space: pre-wrap; }

/* Standalone chip list (no tokens in text) */
.rl-standalone-list {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;
}

/* Condition chip */
.rl-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px 3px 8px; border-radius: 20px; cursor: pointer;
  font-size: 13px; font-weight: 600; line-height: 1.6;
  border: 1.5px dashed #9ca3af; background: #f3f4f6; color: #6b7280;
  transition: all 0.15s; vertical-align: middle;
}
.rl-chip:hover        { border-color: #4f6ef7; color: #4f6ef7; background: #eff2ff; }
.rl-chip--active      { border-style: solid; border-color: #4f6ef7; background: #eff2ff; color: #3b56e0; box-shadow: 0 0 0 2px #c7d2fe; }
.rl-chip--set         { border-style: solid; border-color: #059669; background: #d1fae5; color: #047857; }
.rl-chip--set:hover   { border-color: #047857; background: #a7f3d0; }
.rl-chip--standalone  { padding: 6px 14px; border-radius: 10px; font-size: 13px; }

.rl-chip__prompt {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 600;
}
.rl-chip__prompt svg { width: 13px; height: 13px; flex-shrink: 0; }
.rl-chip__label { font-weight: 600; }
.rl-chip__val   { font-size: 12px; color: #059669; margin-left: 4px; }

/* Inline configuration panel */
.cond-panel {
  margin-top: 10px;
  border: 1.5px solid #c7d2fe; border-radius: 10px;
  background: #fff; overflow: hidden;
}
.cond-panel__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: #eff2ff; border-bottom: 1px solid #c7d2fe;
}
.cond-panel__title {
  font-size: 13px; font-weight: 600; color: #3b56e0;
}
.cond-panel__title em { font-style: normal; color: #1a1f3c; }
.cond-panel__close {
  width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; border-radius: 6px; cursor: pointer; color: #6b7280;
}
.cond-panel__close:hover { background: #e0e7ff; color: #3b56e0; }
.cond-panel__close svg { width: 15px; height: 15px; }

.cond-panel__body {
  padding: 14px 16px; display: flex; flex-direction: column; gap: 12px;
}
.cond-panel__row {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.cond-panel__row--info { background: #f8fafc; border-radius: 7px; padding: 8px 12px; }
.cond-panel__lbl {
  font-size: 11px; font-weight: 700; color: #6b7280;
  text-transform: uppercase; letter-spacing: .4px;
  min-width: 80px; flex-shrink: 0;
}
.cond-panel__unit { font-weight: 400; text-transform: none; color: #9ca3af; }
.cond-panel__input {
  width: 120px; padding: 7px 10px;
  border: 1.5px solid #d1d5db; border-radius: 7px;
  font-size: 14px; font-weight: 700; color: #1a1f3c; outline: none;
  transition: border-color 0.15s;
}
.cond-panel__input:focus { border-color: #4f6ef7; }
.cond-panel__counters {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.cond-panel__counters code {
  font-family: monospace; font-size: 12px; font-weight: 600;
  background: #d1fae5; color: #047857; border-radius: 5px; padding: 2px 8px;
}
.cond-panel__vs {
  font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase;
}
.cond-panel__footer {
  display: flex; justify-content: flex-end;
  padding: 10px 14px; border-top: 1px solid #e5e7eb; background: #fafafa;
}
.btn--sm { padding: 6px 14px; font-size: 13px; }
.mt-2 { margin-top: 8px; }

/* Review – rule logic value */
.review-val--logic {
  font-size: 13px; color: #1d4ed8; font-style: italic; line-height: 1.5;
  background: #eff6ff; border-radius: 6px; padding: 4px 8px;
}

/* ── Toggle switch ── */
.toggle {
  position: relative; display: inline-flex; align-items: center;
  cursor: pointer; flex-shrink: 0;
}
.toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
.toggle__track {
  position: relative; width: 42px; height: 24px;
  background: #d1d5db; border-radius: 12px; transition: background 0.2s;
}
.toggle__track::after {
  content: ''; position: absolute; top: 3px; left: 3px;
  width: 18px; height: 18px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.25);
  transition: transform 0.2s;
}
.toggle input:checked ~ .toggle__track { background: #4f6ef7; }
.toggle input:checked ~ .toggle__track::after { transform: translateX(18px); }

/* ── Action cards ── */
.action-card {
  border: 1.5px solid #e5e7eb; border-radius: 10px;
  overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s;
  background: #fff;
}
.action-card--active {
  border-color: #4f6ef7; box-shadow: 0 0 0 3px rgba(79,110,247,0.1);
}
.action-card__header {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px; cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.action-card__header:hover { background: #f9fafb; }
.action-card--active .action-card__header { background: #f5f7ff; }
.action-card__icon {
  width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.action-card__icon svg { width: 20px; height: 20px; }
.action-card__icon--email  { background: #e0f2fe; color: #0369a1; }
.action-card__icon--script { background: #f3e8ff; color: #7e22ce; }
.action-card__icon--api    { background: #dcfce7; color: #15803d; }
.action-card__info { flex: 1; }
.action-card__title { font-size: 14px; font-weight: 600; color: #111827; }
.action-card__desc  { font-size: 12px; color: #6b7280; margin-top: 2px; }
.action-card__body {
  padding: 0 18px 18px 18px;
  display: flex; flex-direction: column; gap: 14px;
  border-top: 1px solid #e5e7eb;
}
.action-card--active .action-card__body { border-top-color: #c7d2fe; }
.api-body-input {
  width: 100%; font-family: 'Fira Mono', 'Consolas', monospace;
  font-size: 12px; padding: 8px 10px; border: 1.5px solid #d1d5db;
  border-radius: 7px; resize: vertical; color: #374151;
  background: #fafafa; box-sizing: border-box;
}
.api-body-input:focus { outline: none; border-color: #4f6ef7; background: #fff; }
.hint-inline { font-size: 11px; color: #9ca3af; font-weight: 400; margin-left: 4px; }

/* ── Email chip input (Actions step) ── */
.chip-input {
  display: flex; flex-wrap: wrap; gap: 5px;
  padding: 7px 10px; border: 1.5px solid #d1d5db; border-radius: 7px;
  background: #fff; min-height: 40px; cursor: text;
  transition: border-color 0.15s;
}
.chip-input--focused { border-color: #4f6ef7; }
.chip-input--error   { border-color: #dc2626; }
.chip {
  display: inline-flex; align-items: center; gap: 4px;
  background: #eff2ff; color: #3730a3; border: 1px solid #c7d2fe;
  border-radius: 12px; font-size: 12px; padding: 2px 8px; white-space: nowrap;
}
.chip-remove {
  background: none; border: none; cursor: pointer;
  color: #6366f1; font-size: 14px; line-height: 1; padding: 0 1px;
}
.chip-remove:hover { color: #dc2626; }
.chip-input input {
  border: none; outline: none; flex: 1; min-width: 180px;
  font-size: 13px; font-family: inherit; color: #111827;
  background: transparent; padding: 2px 0;
}

/* Do nothing note */
.do-nothing-note {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: #6b7280;
  background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;
  padding: 12px 16px;
}
.do-nothing-note svg { width: 18px; height: 18px; flex-shrink: 0; color: #9ca3af; }

/* ── Additional Definitions card ── */
.defs-card {
  border: 1.5px solid #e5e7eb; border-radius: 10px;
  overflow: hidden; background: #fff;
}
.defs-card__title {
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: #6b7280;
  padding: 10px 16px; background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}
.defs-row {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 16px;
  border-bottom: 1px solid #f3f4f6;
}
.defs-row:last-child { border-bottom: none; }
.defs-row--top { align-items: flex-start; }
.defs-row__info { display: flex; flex-direction: column; gap: 3px; flex: 1; }
.defs-row__label { font-size: 13px; font-weight: 600; color: #111827; }
.defs-row__desc  { font-size: 12px; color: #6b7280; line-height: 1.4; }

.appearances-row {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  margin-top: 10px;
}
.appearances-text { font-size: 13px; color: #374151; }
.appearances-input {
  width: 64px; text-align: center;
  padding: 5px 8px; font-size: 13px;
  border: 1.5px solid #d1d5db; border-radius: 6px;
  font-family: inherit; outline: none;
  transition: border-color 0.15s;
}
.appearances-input:focus { border-color: #4f6ef7; }
.appearances-input.input--error { border-color: #dc2626; }
.appearances-err { width: 100%; margin-top: 4px; }

/* ── Weekday picker ── */
.weekday-picker {
  display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px;
}
.weekday-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 44px; height: 34px; border-radius: 8px; cursor: pointer;
  font-size: 12px; font-weight: 600; user-select: none;
  border: 1.5px solid #d1d5db; color: #6b7280; background: #f9fafb;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.weekday-btn:hover { border-color: #4f6ef7; color: #4f6ef7; background: #f0f3ff; }
.weekday-btn--active {
  background: #4f6ef7; border-color: #4f6ef7; color: #fff;
}
.weekday-btn--active:hover { background: #3b5bdb; border-color: #3b5bdb; }

/* Custom cron override link */
.btn-link {
  background: none; border: none; padding: 0; cursor: pointer;
  color: #6b7280; font-size: 12px; text-decoration: underline;
  font-family: inherit;
}
.btn-link:hover { color: #4f6ef7; }
.custom-cron-row {
  display: flex; flex-direction: column; gap: 6px; margin-top: 8px;
}
.custom-cron-row input {
  font-family: 'Fira Mono', 'Consolas', monospace; font-size: 13px;
}

/* Review – actions row */
.review-actions-none { font-size: 13px; color: #9ca3af; font-style: italic; }
.review-actions-list { display: flex; gap: 8px; flex-wrap: wrap; }
.review-action-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
}
.review-action-chip svg { width: 13px; height: 13px; }
.review-action-chip--email  { background: #e0f2fe; color: #0369a1; }
.review-action-chip--script { background: #f3e8ff; color: #7e22ce; }
.review-action-chip--api    { background: #dcfce7; color: #15803d; }
</style>
