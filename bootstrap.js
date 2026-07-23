import { saveSettingsDebounced } from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';

const FEATURE_PATH = 'scripts/extensions/third-party/NemoRewrite';
const SETTINGS_ROOT_ID = 'nemo_rewrite_settings';
const SETTINGS_CONTAINER_SELECTORS = ['#extensions_settings2', '#extensions_settings'];
const FIELD_MAP = Object.freeze({
    nemo_rewrite_enabled: ['enabled', 'boolean'],
    nemo_rewrite_disable_standalone: ['disableWhenStandaloneDetected', 'boolean'],
    nemo_rewrite_ask_note: ['askForNote', 'boolean'],
    nemo_rewrite_show_note_action: ['showNoteAction', 'boolean'],
    nemo_rewrite_store_notes: ['storeEditNotes', 'boolean'],
    nemo_rewrite_notes_to_nemolore: ['sendNotesToNemoLore', 'boolean'],
    nemo_rewrite_text_prompt: ['textRewritePrompt', 'string'],
    nemo_rewrite_shorten_prompt: ['textShortenPrompt', 'string'],
    nemo_rewrite_expand_prompt: ['textExpandPrompt', 'string'],
    nemo_rewrite_custom_prompt: ['textCustomPrompt', 'string'],
    nemo_rewrite_note_template: ['noteInstructionTemplate', 'string'],
    nemo_rewrite_use_streaming: ['useStreaming', 'boolean'],
    nemo_rewrite_apply_regex: ['applyRegexOnRewrite', 'boolean'],
    nemo_rewrite_dynamic_tokens: ['useDynamicTokens', 'boolean'],
    nemo_rewrite_dynamic_mode: ['dynamicTokenMode', 'string'],
    nemo_rewrite_highlight_duration: ['highlightDuration', 'integer'],
    nemo_rewrite_remove_prefix: ['removePrefix', 'string'],
    nemo_rewrite_remove_suffix: ['removeSuffix', 'string'],
    nemo_rewrite_tokens: ['rewriteTokens', 'integer'],
    nemo_rewrite_shorten_tokens: ['shortenTokens', 'integer'],
    nemo_rewrite_expand_tokens: ['expandTokens', 'integer'],
    nemo_rewrite_custom_tokens: ['customTokens', 'integer'],
    nemo_rewrite_tokens_add: ['rewriteTokensAdd', 'integer'],
    nemo_rewrite_shorten_tokens_add: ['shortenTokensAdd', 'integer'],
    nemo_rewrite_expand_tokens_add: ['expandTokensAdd', 'integer'],
    nemo_rewrite_custom_tokens_add: ['customTokensAdd', 'integer'],
    nemo_rewrite_tokens_mult: ['rewriteTokensMult', 'number'],
    nemo_rewrite_shorten_tokens_mult: ['shortenTokensMult', 'number'],
    nemo_rewrite_expand_tokens_mult: ['expandTokensMult', 'number'],
    nemo_rewrite_custom_tokens_mult: ['customTokensMult', 'number'],
    nemo_rewrite_show_rewrite: ['showRewrite', 'boolean'],
    nemo_rewrite_show_shorten: ['showShorten', 'boolean'],
    nemo_rewrite_show_expand: ['showExpand', 'boolean'],
    nemo_rewrite_show_custom: ['showCustom', 'boolean'],
    nemo_rewrite_show_delete: ['showDelete', 'boolean'],
});

let settingsObserver = null;
let reconcileTimer = null;
let mounting = false;
let pageHiding = false;

function getContainer() {
    return SETTINGS_CONTAINER_SELECTORS
        .map(selector => document.querySelector(selector))
        .find(Boolean) ?? null;
}

function getSettings() {
    return window.NemoRewrite?.getSettings?.() ?? extension_settings.NemoRewrite ?? null;
}

function coerceValue(input, type) {
    if (type === 'boolean') return input.checked;
    if (type === 'integer') {
        const parsed = Number.parseInt(input.value, 10);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    if (type === 'number') {
        const parsed = Number.parseFloat(input.value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return input.value;
}

function syncConditionalUi(root, settings) {
    const useDynamic = Boolean(settings.useDynamicTokens);
    const mode = settings.dynamicTokenMode || 'multiplicative';
    root.querySelector('#nemo_rewrite_static_tokens')?.classList.toggle('nemo-rewrite-hidden', useDynamic);
    root.querySelector('#nemo_rewrite_dynamic_token_settings')?.classList.toggle('nemo-rewrite-hidden', !useDynamic);
    root.querySelector('#nemo_rewrite_additive_tokens')?.classList.toggle('nemo-rewrite-hidden', mode !== 'additive');
    root.querySelector('#nemo_rewrite_multiplicative_tokens')?.classList.toggle('nemo-rewrite-hidden', mode !== 'multiplicative');

    const notice = root.querySelector('#nemo_rewrite_standalone_notice');
    if (notice) {
        const standaloneDetected = Boolean(document.querySelector('.rewrite-extension-settings'));
        const suppressed = settings.disableWhenStandaloneDetected && standaloneDetected;
        notice.style.display = suppressed ? '' : 'none';
        notice.textContent = suppressed
            ? 'The native Nemo Rewrite menu is paused because the standalone rewrite extension is active.'
            : '';
    }
}

function syncSettingsToUi(root) {
    const settings = getSettings();
    if (!settings) return;
    for (const [id, [key, type]] of Object.entries(FIELD_MAP)) {
        const input = root.querySelector(`#${id}`);
        if (!input) continue;
        if (type === 'boolean') input.checked = Boolean(settings[key]);
        else input.value = String(settings[key] ?? '');
    }
    syncConditionalUi(root, settings);
}

function bindSettingsUi(root) {
    if (root.dataset.nemoRewriteBound === 'true') return;
    root.dataset.nemoRewriteBound = 'true';
    root.addEventListener('change', event => {
        const input = event.target.closest('input, textarea, select');
        const descriptor = input ? FIELD_MAP[input.id] : null;
        const settings = getSettings();
        if (!descriptor || !settings) return;
        const [key, type] = descriptor;
        settings[key] = coerceValue(input, type);
        saveSettingsDebounced();
        syncConditionalUi(root, settings);
    });
}

async function mountSettingsUi() {
    if (mounting || pageHiding || document.getElementById(SETTINGS_ROOT_ID)) return;
    const container = getContainer();
    if (!container) return;
    mounting = true;
    try {
        const response = await fetch(`${FEATURE_PATH}/settings.html`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Failed to load Nemo Rewrite settings (${response.status})`);
        if (pageHiding || document.getElementById(SETTINGS_ROOT_ID)) return;
        container.insertAdjacentHTML('beforeend', await response.text());
        const root = document.getElementById(SETTINGS_ROOT_ID);
        if (!root) return;
        bindSettingsUi(root);
        syncSettingsToUi(root);
    } catch (error) {
        console.error('[Nemo Rewrite] Failed to remount settings UI', error);
    } finally {
        mounting = false;
    }
}

function scheduleReconcile() {
    clearTimeout(reconcileTimer);
    reconcileTimer = setTimeout(() => {
        reconcileTimer = null;
        void mountSettingsUi();
    }, 75);
}

await import('./index.js');
await mountSettingsUi();
settingsObserver = new MutationObserver(scheduleReconcile);
settingsObserver.observe(document.body, { childList: true, subtree: true });

window.addEventListener('pagehide', () => {
    pageHiding = true;
    clearTimeout(reconcileTimer);
    settingsObserver?.disconnect();
    settingsObserver = null;
}, { once: true });
