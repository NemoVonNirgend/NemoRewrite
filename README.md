# Nemo Rewrite

Nemo Rewrite is a standalone SillyTavern extension for editing selected text inside assistant messages.

## Features

- Rewrite, shorten, expand, custom-instruction, and delete actions from a selection menu.
- Streaming where supported by the active SillyTavern backend.
- Selection-aware token budgets and optional AI-output regex processing.
- Recent-change undo controls.
- Optional private edit notes, with an opt-in bridge to NemoLore preference evidence.
- Automatic settings migration from the former `NemoPresetExt.rewrite` storage without deleting the legacy copy.
- Assistant-only selection guards, conflict-aware saves and undo, and cancellation-safe generation lifecycle handling.

Nemo Rewrite refuses to apply a generated edit if the underlying message changed while generation was running. Undo follows the same rule, protecting later manual edits instead of silently replacing them.

## Install

Install through SillyTavern's extension manager using:

`https://github.com/NemoVonNirgend/NemoRewrite`

This repository is under active extraction and modernization on its development branch.
