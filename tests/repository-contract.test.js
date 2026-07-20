import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('manifest points to the standalone runtime and repository', async () => {
    const manifest = JSON.parse(await read('manifest.json'));
    assert.equal(manifest.display_name, 'Nemo Rewrite');
    assert.equal(manifest.js, 'index.js');
    assert.equal(manifest.css, 'style.css');
    assert.equal(manifest.homePage, 'https://github.com/NemoVonNirgend/NemoRewrite');
});

test('runtime uses standalone paths and preserves a legacy migration source', async () => {
    const source = await read('index.js');
    assert.match(source, /third-party\/NemoRewrite/);
    assert.match(source, /extension_settings\.NemoPresetExt\?\.rewrite/);
    assert.doesNotMatch(source, /third-party\/NemoPresetExt\/features\/rewrite/);
});
