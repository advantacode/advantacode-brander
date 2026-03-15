# AdvantaCode Brander — Technical Overview

## Overview

AdvantaCode Brander is a **design token generation engine** designed to produce consistent branding outputs for modern web applications.

The tool converts a simple configuration into multiple outputs used across:

* frontend frameworks
* component libraries
* CSS systems
* design tools

The goal is to provide a **single source of truth for brand tokens** while supporting multiple frameworks and environments.

Brander is intentionally **framework-agnostic** and designed to integrate with ecosystems such as Vue, React, Laravel, Quasar, and Tailwind.

---

## Branding Note

This document describes the software architecture and maintainer workflow for AdvantaCode Brander.

Use of the software is governed by the MIT license. Use of the AdvantaCode name, logos, and branding is governed separately by [TRADEMARKS.md](TRADEMARKS.md).

---

# Core Architecture

AdvantaCode Brander is built around a **token pipeline**.

```
brand.config.ts
        ↓
token engine
        ↓
primitive tokens
        ↓
semantic tokens
        ↓
framework outputs
```

This layered architecture allows tokens to remain reusable across different platforms.

---

# Token Layers

The system uses three token layers.

## 1. Primitive Tokens

Primitive tokens represent raw color values and palette scales.

Example:

```
primary-50
primary-100
primary-200
...
primary-950
```

These are generated from the base color using OKLCH lightness scaling.

Example CSS output:

```
--primary-50
--primary-100
--primary-200
```

Primitive tokens should **never be used directly by components**.

---

## 2. Semantic Tokens

Semantic tokens describe **UI meaning rather than color values**.

Examples:

```
background
surface
text
border
primary
primary-foreground
muted
success
warning
danger
info
```

Example output:

```
--background
--text
--primary
```

Components reference semantic tokens rather than primitives.

---

## 3. Framework Tokens

Framework tokens convert semantic tokens into framework-specific formats.

Examples include:

```
Tailwind preset
Quasar SCSS variables
Figma tokens
TypeScript tokens
```

---

# Color Engine

Brander uses the **OKLCH color space** for palette generation.

OKLCH separates color into:

```
L = Lightness
C = Chroma
H = Hue
```

This makes it easier to create perceptually consistent color scales.

Example scale generation:

```
primary-50
primary-100
primary-200
...
primary-950
```

The lightness values are adjusted while preserving chroma and hue.

Example:

```
oklch(0.97 0.2 45)
oklch(0.93 0.2 45)
oklch(0.87 0.2 45)
...
```

Color conversion is handled using the Culori library.

---

# Light and Dark Theme Generation

The token engine generates **both light and dark themes automatically**.

Themes are implemented using CSS custom properties.

Example output:

```
:root {
  --background: oklch(0.99 0.02 95);
  --text: oklch(0.20 0.02 95);
}

[data-theme="dark"] {
  --background: oklch(0.14 0.02 95);
  --text: oklch(0.95 0.02 95);
}
```

Applications can toggle themes using a `data-theme` attribute.

Example:

```
<html data-theme="dark">
```

---

# CLI Architecture

Brander is implemented as a Node CLI tool.

The entry point is defined in `package.json`.

```
"bin": {
  "advantacode-brander": "./dist/index.js"
}
```

CLI flow:

```
CLI entry
   ↓
command parsing
   ↓
generate | setup | init
   ↓
project setup helpers
   ↓
load configuration
   ↓
generate token palette
   ↓
generate semantic tokens
   ↓
write platform outputs
```

Command roles:

* default generate command writes token artifacts only
* `setup` configures an existing app by creating `brand.config.ts`, adding a package script, patching stylesheet imports, and then generating tokens
* `init` uses the same setup flow but is intended to be called by a higher-level scaffolding tool such as `advantacode-init`

---

# Package Structure

```
advantacode-brander
│
├─ src
│  ├─ index.ts
│  ├─ generate-tokens.ts
│  ├─ setup.ts
│  ├─ engine/
│  ├─ adapters/
│  └─ culori.d.ts
│
├─ dist
│
├─ brand.config.ts
├─ tsconfig.json
├─ package.json
└─ README.md
```

---

# Source Directory

```
src/
```

Contains the CLI entry point, token engine, and output adapters.

```
src/index.ts
```

CLI entry script.

```
src/generate-tokens.ts
```

Generation orchestration and output writing.

```
src/setup.ts
```

Project setup helpers for `setup` and `init`.

```
src/engine/
```

Color parsing, palette generation, semantic mapping, and theme assembly.

```
src/adapters/
```

Output adapters for CSS, SCSS, Tailwind, TypeScript, JSON, and Figma.

```
src/culori.d.ts
```

Type definitions for Culori.

---

# Token Source Files

```
brand.config.ts
```

Defines the user-provided project settings and design tokens.
Also supports `project` output settings, optional `adapters` / `formats`, and optional `typography` (fonts) + `spacing` scales.

Example:

```ts
export default {
  project: {
    outDir: "src/assets/brand",
    styleFile: "src/styles.css"
  },
  adapters: ["tailwind"],
  css: {
    prefix: ""
  },
  colors: {
    primary: "amber-500",
    secondary: "zinc-700",
    info: "sky-500"
  },
  typography: {
    fontSans: "Inter",
    fontMono: "JetBrains Mono"
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem"
  }
};
```

Environment variables can override these values at runtime.

---

# Output Structure

The generator produces multiple outputs.

```
dist/brander/
   tokens.css
   tokens.scss
   tokens.ts
   tokens.json
   metadata.json

dist/brander/themes/
   light.css
   dark.css

dist/brander/adapters/
   tailwind.preset.ts
   bootstrap.variables.scss
   figma.tokens.json
```

Each output targets a different platform.

---

# CSS Token Output

Example:

```
:root {
  --primary: oklch(0.65 0.2 45);
}
```

These tokens can be used directly in CSS.

---

# Tailwind Integration

The generator produces a Tailwind preset.

```
dist/brander/adapters/tailwind.preset.ts
```

Example:

```
export default {
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)"
      }
    }
  }
}
```

---

# SCSS / Bootstrap Integration

SCSS-based frameworks can use native Sass variables.

Generated file:

```
dist/brander/tokens.scss
dist/brander/adapters/bootstrap.variables.scss
```

Example:

```
@use "../tokens.scss" as tokens;

$primary: tokens.$primary;
$secondary: tokens.$secondary;
$info: tokens.$info;
```

---

# Figma Token Export

Design tokens can be exported to JSON for use in design tools.

```
dist/brander/adapters/figma.tokens.json
```

Example:

```
{
  "color": {
    "primary": {
      "value": "oklch(0.65 0.2 45)"
    }
  }
}
```

---

# Configuration

User configuration is defined in:

```
brand.config.ts
```

Example:

```
export default {
  name: "My Company",

  project: {
    outDir: "src/assets/brand",
    styleFile: "src/styles.css"
  },
  adapters: ["tailwind"],
  colors: {
    primary: "amber-500",
    secondary: "zinc-700"
  },
  typography: {
    fontSans: "Inter",
    fontMono: "JetBrains Mono"
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem"
  }
}
```

Environment variables can override these values.

---

# Development Workflow

Contributor setup starts with a local clone of the repository.

```
git clone https://github.com/advantacode/advantacode-brander.git
cd advantacode-brander
npm install
```

---

# Build Process

TypeScript is compiled using:

```
npm run build
```

Output is placed in:

```
dist/
```

---

# Lint

Lint the repository source and tests with:

```
npm run lint
```

Generated output folders such as `dist/brander` or `src/brander` are intentionally excluded.

---

# Test

Run the integration suite against the built CLI:

```
npm test
```

The current test coverage includes:

* `--help` CLI output
* token generation into the default `dist/brander` folder
* `setup` creating config, scripts, and stylesheet imports for `src/brander`
* invalid config failures returning clean error messages

---

# Release and Publishing

For v1.0.0, keep release mechanics intentionally simple and rely on a short manual checklist.

Preflight checks:

```
npm run release:check
```

Recommended flow:

* update `CHANGELOG.md`
* run `npm run release:check`
* bump version with `npm version patch|minor|major`
* publish with `npm publish`
* push the commit + tag

---

# Run Token Generator

For local repository development, you can execute the generator directly with:

```
npm run tokens
```

This is useful for validating output changes while working inside the package itself.

---

# Local CLI Development

You can run the compiled CLI locally without publishing:

```
npm run build
npm run cli
```

Preferred consumer-flow testing uses `npm pack`, because it validates the same package contents npm consumers will install.

---

# Testing In Another Project

The recommended real-world QA flow is to install Brander as a `devDependency` in another app using a packed tarball.

Why `devDependency`:

* Brander is a build-time code generation tool
* the consuming app needs the generated token files at runtime, not the generator itself

Build and pack Brander:

```
npm run build
npm pack --pack-destination /tmp
```

Then install it into another project such as `advantacode-starter`:

```
cd ../advantacode-starter
npm i -D /tmp/advantacode-brander-0.1.0.tgz
```

Add a script to the app:

```json
{
  "scripts": {
    "brand:generate": "advantacode-brander"
  }
}
```

Or let Brander do that setup explicitly:

```
npx --package @advantacode/brander advantacode-brander setup --style src/style.css
```

That command:

* creates `brand.config.ts` if it does not exist
* adds `brand:generate` to `package.json` if it is missing
* adds token CSS imports to the chosen stylesheet
* runs token generation

What to validate:

* the package installs cleanly as a `devDependency`
* `advantacode-brander` resolves correctly from npm scripts
* `brand.config.ts` is detected automatically
* generated files land in the expected folder
* rerunning generation replaces old outputs cleanly
* the app builds after importing the generated CSS
* light and dark theme variables resolve correctly
* changing a color in `brand.config.ts` produces a visible change after regeneration

Starter app note:

* if the starter already defines overlapping theme variables, remove or replace that handwritten theme layer so the generated tokens become the single source of truth
* `setup` is intended for an existing app repository, while `init` is intended for use by an outer scaffolding tool that already knows the app structure

---

# Publishing Notes

Brander should be published with compiled `dist/` files included in the npm package, but local generated token output does not need to be committed.

Current package behavior:

* `dist/` stays in `.gitignore`
* `npm run build` cleans and rebuilds compiled CLI files
* `package.json` limits publish contents to compiled JavaScript plus docs and license
* generated sample token artifacts are not published

Verify what npm will publish:

```
npm run release:check
```

`release:check` runs linting, the test suite, and then the npm pack dry run. The tarball output should list compiled files such as `dist/index.js`, `dist/generate-tokens.js`, adapter modules, `README.md`, and `LICENSE`, without shipping any local `dist/brander` output.

---

# Recommended Consumer Project Structure

One common consumer layout looks like this:

```
my-app
│
├─ brand.config.ts
├─ .env
│
├─ dist
│  └─ brander
│     ├─ tokens.css
│     ├─ tokens.scss
│     ├─ tokens.ts
│     ├─ tokens.json
│     ├─ metadata.json
│     ├─ themes
│     │  ├─ light.css
│     │  └─ dark.css
│     └─ adapters
│        ├─ tailwind.preset.ts
│        ├─ bootstrap.variables.scss
│        └─ figma.tokens.json
│
└─ src
   └─ assets
      └─ styles.css
```

---

# Dependencies

Runtime dependencies:

```
culori
dotenv
tsx
```

These are used for color conversions, environment loading, and executing the TypeScript-based CLI entry.

Development dependencies:

```
typescript
eslint
@typescript-eslint/parser
@typescript-eslint/eslint-plugin
@types/node
```

---

# TypeScript Configuration

The project compiles TypeScript using:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "strict": true
  },
  "include": ["src"]
}
```

---

# CLI Entry Point

The source CLI entry point lives at:

```
src/index.ts
```

It uses this executable header during development:

```ts
#!/usr/bin/env -S node --import tsx/esm
```

The published binary entry in `package.json` points to the compiled output:

```json
{
  "bin": {
    "advantacode-brander": "./dist/index.js"
  }
}
```

---

# Future Architecture Goals

Planned improvements include:

* automatic accessible color contrast generation
* dark mode optimization
* design token specification support
* plugin architecture
* framework adapters
* optional semantic packs for charts, dashboards, or app shells

---

# Ecosystem Integration

Brander is designed to integrate into the larger AdvantaCode ecosystem.

```
@advantacode/brander
advantacode-init
advantacode-starter
@advantacode/ui
```

This allows developers to scaffold fully branded applications with a single command.

---

# Design Philosophy

AdvantaCode Brander follows several key principles:

1. **Single source of truth**
2. **Framework independence**
3. **Semantic token design**
4. **Accessibility-friendly color systems**
5. **Extensible architecture**

---

# Summary

AdvantaCode Brander acts as the **token engine for the AdvantaCode ecosystem**, enabling consistent branding across applications, frameworks, and design tools.

By separating primitives, semantics, and framework outputs, the system provides both flexibility and long-term maintainability.
