# Changelog

All notable changes to this project will be documented in this file.

The format is based on *Keep a Changelog*, and this project adheres to *Semantic Versioning*.

## [Unreleased]

### Added

### Changed

### Fixed

## [0.3.0] - 2026-03-26

### Added
- `brand.config.*` can store project defaults (`project.outDir`, `project.styleFile`), and generation defaults (`adapters`, `formats`, `theme`).
- `spacing` and `typography` tokens (fonts) are emitted alongside color tokens.
- `setup` now generates `brand.config.ts` by default (while still supporting existing `brand.config.js` / `brand.config.mjs` / `brand.config.cjs`).
- `package.json` scripts can stay minimal (`"brand:generate": "advantacode-brander"`) with project defaults living in `brand.config.*`.
