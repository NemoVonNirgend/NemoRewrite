import test from 'node:test';
import assert from 'node:assert/strict';
import { createStandaloneSettings, replaceSelectionIfCurrent } from '../src/rewrite-core.js';

test('standalone settings migrate a legacy rewrite namespace without mutating it', () => {
    const legacy = { enabled: false, noteHistory: [{ note: 'Keep' }] };
    const result = createStandaloneSettings({ current: null, legacy, defaults: { enabled: true, noteHistory: [] } });
    assert.equal(result.created, true);
    assert.equal(result.migrated, true);
    assert.equal(result.settings.enabled, false);
    assert.equal(result.settings._migratedFromNemoPresetExt, true);
    result.settings.noteHistory.push({ note: 'New' });
    assert.equal(legacy.noteHistory.length, 1);
});

test('standalone settings prefer their current namespace over legacy data', () => {
    const result = createStandaloneSettings({
        current: { enabled: true },
        legacy: { enabled: false },
        defaults: { enabled: false, noteHistory: [] },
    });
    assert.equal(result.created, false);
    assert.equal(result.migrated, false);
    assert.equal(result.settings.enabled, true);
});

test('selection replacement refuses stale messages and invalid offsets', () => {
    assert.equal(replaceSelectionIfCurrent({ expectedContent: 'hello world', currentContent: 'hello world', start: 6, end: 11, replacement: 'there' }), 'hello there');
    assert.equal(replaceSelectionIfCurrent({ expectedContent: 'hello world', currentContent: 'manually edited', start: 6, end: 11, replacement: 'there' }), null);
    assert.equal(replaceSelectionIfCurrent({ expectedContent: 'hello', currentContent: 'hello', start: 4, end: 20, replacement: '' }), null);
});
