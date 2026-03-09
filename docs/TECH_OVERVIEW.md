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

Defines the user-provided color inputs.

Example:

```ts
export default {
  css: {
    prefix: ""
  },
  colors: {
    primary: "amber-500",
    secondary: "zinc-700",
    info: "sky-500"
  }
};
```

Environment variables can override these values at runtime.

---

# Output Structure

The generator produces multiple outputs.

```
dist/generated/
   tokens.css
   tokens.scss
   tokens.ts
   tokens.json
   metadata.json

dist/generated/themes/
   light.css
   dark.css

dist/generated/adapters/
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
dist/generated/adapters/tailwind.preset.ts
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
dist/generated/tokens.scss
dist/generated/adapters/bootstrap.variables.scss
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
dist/generated/adapters/figma.tokens.json
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

  colors: {
    primary: "amber-500",
    secondary: "zinc-700"
  }
}
```

Environment variables can override these values.

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

# Local CLI Development

Preferred local CLI testing uses `npm pack`, because it validates the same package contents npmjs consumers will install.

In the Brander repo:

```
npm run build
npm pack --pack-destination /tmp
```

In another project:

```
npm i -D /tmp/advantacode-brander-0.0.1.tgz
```

Then add an npm script such as:

```
"brand:generate": "advantacode-brander --out src/generated/brand --format css,json,typescript --theme both"
```

This tests:

* package contents
* CLI resolution from `node_modules/.bin`
* config discovery
* generated output structure
* integration with a consuming app

---

# Dependencies

Runtime dependency:

```
culori
```

Used for color conversions and OKLCH operations.

Development dependencies:

```
typescript
tsx
eslint
@types/node
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
