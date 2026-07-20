export function createStandaloneSettings({ current, legacy, defaults }) {
    const hasCurrent = current && typeof current === 'object' && !Array.isArray(current);
    const hasLegacy = legacy && typeof legacy === 'object' && !Array.isArray(legacy);
    const source = hasCurrent ? current : hasLegacy ? legacy : {};
    return {
        created: !hasCurrent,
        migrated: !hasCurrent && Boolean(hasLegacy),
        settings: {
            ...defaults,
            ...source,
            ...(hasCurrent ? {} : hasLegacy ? { _migratedFromNemoPresetExt: true } : {}),
            noteHistory: Array.isArray(source.noteHistory) ? [...source.noteHistory] : [],
        },
    };
}

export function replaceSelectionIfCurrent({ expectedContent, currentContent, start, end, replacement }) {
    if (String(currentContent ?? '') !== String(expectedContent ?? '')) return null;
    const from = Number(start);
    const to = Number(end);
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < from || to > currentContent.length) return null;
    return currentContent.slice(0, from) + String(replacement ?? '') + currentContent.slice(to);
}
