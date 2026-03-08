# AdvantaCode Brander

AdvantaCode Brander is a **design token generator** that produces consistent branding tokens for modern web applications.

It converts a simple configuration into reusable outputs for multiple platforms including:

* CSS variables
* TypeScript tokens
* Tailwind presets
* Quasar variables
* Figma tokens

AdvantaCode Brander uses **OKLCH color space** to generate perceptually consistent color scales.

---

# Features

* Single source of truth for brand tokens
* OKLCH color scaling
* Multi-framework outputs
* CLI tool usable across any JavaScript stack
* Environment variable support
* Tailwind integration
* Design-tool exports (Figma)

---

# Installation

Run using npx:

```
npx @advantacode/brander
```

Or install globally:

```
npm install -g @advantacode/brander
```

Run:

```
advantacode-brander
```

CLI options:

```
advantacode-brander --help
advantacode-brander --out src/tokens
advantacode-brander --format css,tailwind,figma
advantacode-brander --theme dark
```

Supported flags:

* `--out <dir>` writes generated files to a custom folder instead of `dist/generated`
* `--format <list>` limits output to specific formats: `all`, `css`, `json`, `typescript` or `ts`, `scss`, `tailwind`, `bootstrap`, `figma`
* `--theme <value>` limits theme CSS output to `light`, `dark`, or `both`
* `--help`, `-h` prints the CLI help text

---

# Configuration

Create a `brand.config.ts` file in your project root.

Example:

```ts
export default {
  name: process.env.COMPANY_NAME || "My Company",

  colors: {
    primary: process.env.PRIMARY_COLOR || "amber-500",
    secondary: process.env.SECONDARY_COLOR || "zinc-700",
    neutral: process.env.NEUTRAL_COLOR || process.env.SECONDARY_COLOR || "zinc-700",
    accent: process.env.ACCENT_COLOR || "amber-400",
    info: process.env.INFO_COLOR || "sky-500",

    success: process.env.SUCCESS_COLOR || "green-500",
    warning: process.env.WARNING_COLOR || "yellow-500",
    danger: process.env.DANGER_COLOR || "red-500"
  }
};
```

Supported color inputs:

* Tailwind-style tokens like `amber-500`
* CSS color strings like `#f59e0b` or `rgb(245 158 11)`
* OKLCH values like `oklch(0.76859 0.164659 70.08)`

---

# Environment Variables

Brander supports environment variables via `.env`.

Example:

```
COMPANY_NAME=AdvantaCode
PRIMARY_COLOR=amber-500
SECONDARY_COLOR=zinc-700
NEUTRAL_COLOR=zinc-700
ACCENT_COLOR=amber-400
INFO_COLOR=sky-500
SUCCESS_COLOR=green-500
WARNING_COLOR=yellow-500
DANGER_COLOR=red-500
```

---

# Generated Outputs

Running the CLI with no flags generates all formats into `dist/generated` and writes both light and dark theme CSS.

```
dist/
  generated/
   tokens.css
   tokens.scss
   tokens.ts
   tokens.json
   metadata.json
   themes/
     light.css
     dark.css
   adapters/
     tailwind.preset.ts
     bootstrap.variables.scss
     figma.tokens.json
```

---

# CSS Variables

Example generated `tokens.css`:

```css
:root {
  --ac-primary-500: oklch(0.65 0.2 45);
  --ac-neutral-50: oklch(0.97 0.02 95);
}
```

Usage:

```css
:root {
  --ac-background: var(--ac-neutral-50);
  --ac-text: var(--ac-neutral-950);
}
```

---

# Theme Tokens

Example:

```css
:root {
  --ac-background: var(--ac-neutral-50);
  --ac-surface: var(--ac-neutral-100);
  --ac-text: var(--ac-neutral-950);
  --ac-border: var(--ac-neutral-200);
  --ac-primary: var(--ac-primary-600);
  --ac-primary-foreground: var(--ac-neutral-50);
}

[data-theme="dark"] {
  --ac-background: var(--ac-neutral-950);
  --ac-surface: var(--ac-neutral-900);
  --ac-text: var(--ac-neutral-50);
}
```

---

# TypeScript Tokens

Generated file:

```
dist/generated/tokens.ts
```

Usage:

```ts
import { tokens, metadata } from "./dist/generated/tokens";

console.log(tokens.color.semantic.light.primary.value);
console.log(metadata.adapters);
```

This output is intended for typed apps, scripts, and build-time tooling.

---

# SCSS Tokens

Generated file:

```
dist/generated/tokens.scss
```

Usage:

```scss
@use "./dist/generated/tokens.scss" as tokens;

.button {
  background: tokens.$ac-primary;
  color: tokens.$ac-primary-foreground;
}
```

Light semantic tokens are emitted as Sass variables like `$ac-background`, and dark semantic tokens are emitted as `$ac-dark-background`.

---

# Tailwind Integration

Generated preset:

```
dist/generated/adapters/tailwind.preset.ts
```

Usage:

```ts
import preset from "./dist/generated/adapters/tailwind.preset";

export default {
  presets: [preset]
};
```

Use tokens in Tailwind:

```
bg-ac-primary
text-ac-danger
border-ac-secondary
```

---

# Bootstrap / SCSS Frameworks

Generated file:

```
dist/generated/adapters/bootstrap.variables.scss
```

Example output:

```scss
@use "../tokens.scss" as tokens;

$primary: tokens.$ac-primary;
$secondary: tokens.$ac-secondary;
$info: tokens.$ac-info;
```

---

# Figma Token Export

Generated:

```
dist/generated/adapters/figma.tokens.json
```

Example:

```json
{
  "color": {
    "primary": {
      "value": "oklch(0.65 0.2 45)"
    }
  }
}
```

This allows importing tokens into design tools.

---

# Metadata

Generated file:

```
dist/generated/metadata.json
```

Example:

```json
{
  "version": "0.0.1",
  "generated": "2026-03-08T00:00:00.000Z",
  "themes": ["light", "dark"],
  "adapters": ["tailwind", "bootstrap", "figma"],
  "artifacts": ["tokens.css", "tokens.scss", "tokens.ts", "tokens.json", "metadata.json"]
}
```

This is useful for CI, tooling, adapter discovery, and cache invalidation.

---

# Recommended Project Structure

```
my-app
│
├─ brand.config.ts
├─ .env
│
├─ dist
│  └─ generated
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

# Color Engine

Brander uses the **OKLCH color space** to generate consistent color scales.

Example scale:

```
primary-50
primary-100
primary-200
...
primary-950
```

Example output:

```
oklch(0.97 0.2 45)
oklch(0.93 0.2 45)
oklch(0.87 0.2 45)
...
```

Color conversions are handled using the Culori library.

---

# Development

Clone the repository:

```
git clone https://github.com/advantacode/brander
cd brander
```

Install dependencies:

```
npm install
```

---

# Build

```
npm run build
```

---

# Run Token Generator

```
npm run tokens
```

---

# Local CLI Testing

You can test the CLI locally without publishing.

```
npm run build
npm run cli
```

Or link the package and run the installed binary:

```
npm link
```

Then run:

```
advantacode-brander
```

---

# Dependencies

Runtime:

* culori

Development:

* typescript
* tsx
* eslint
* @types/node

---

# TypeScript Configuration

```
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "outDir": "dist",
    "rootDir": ".",
    "esModuleInterop": true,
    "strict": true
  },
  "include": ["src"]
}
```

---

# CLI Entry Point

```
src/index.ts
```

```ts
#!/usr/bin/env node
import "./generate-tokens.js";
```

---

# Roadmap

Planned improvements:

* dark theme generation
* CLI flags
* custom output directories
* automatic Tailwind palette generation
* design token standard support
* framework plugins

---

# Ecosystem

AdvantaCode Brander is part of the AdvantaCode ecosystem.

```
@advantacode/brander
@advantacode/init
@advantacode/starter
```

This allows developers to bootstrap fully branded applications with a single command.

---

# License

MIT License

---

# Author

Anthony Penn
AdvantaCode
