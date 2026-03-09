# AdvantaCode Brander

AdvantaCode Brander is a **design token generator** that produces consistent branding tokens for modern web applications.

It converts a simple configuration into reusable outputs for multiple platforms including:

* CSS variables
* TypeScript tokens
* Tailwind presets
* Bootstrap / SCSS variables
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

Node.js 20 or newer is required.

Recommended for app projects:

```bash
npm install -D @advantacode/brander
```

One-off usage with `npx`:

```bash
npx --package @advantacode/brander advantacode-brander
```

Global install:

```bash
npm install -g @advantacode/brander
```

Run:

```bash
advantacode-brander
```

CLI options:

```
advantacode-brander --help
advantacode-brander --out src/tokens
advantacode-brander --format css,tailwind,figma
advantacode-brander --theme dark
advantacode-brander --prefix ac
advantacode-brander setup --out src/brander --style src/style.css
advantacode-brander init --out src/brander
```

Supported flags:

* `--out <dir>` writes generated files to a custom folder instead of `dist/brander`
* `--format <list>` limits output to specific formats: `all`, `css`, `json`, `typescript` or `ts`, `scss`, `tailwind`, `bootstrap`, `figma`
* `--theme <value>` limits theme CSS output to `light`, `dark`, or `both`
* `--prefix <value>` applies a CSS variable prefix like `ac`, producing variables such as `--ac-primary`
* `--help`, `-h` prints the CLI help text

Setup commands:

* `advantacode-brander setup` configures an existing app by creating `brand.config.ts` if needed, adding a `brand:generate` script, patching a stylesheet with token imports, and generating tokens
* `advantacode-brander init` runs the same setup flow for a freshly created app and is intended to be called by a higher-level scaffolder such as `advantacode-init`

---

# Configuration

Create a `brand.config.ts` file in your project root.

Example:

```ts
export default {
  name: process.env.COMPANY_NAME || "My Company",
  css: {
    prefix: process.env.CSS_PREFIX ?? ""
  },

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
CSS_PREFIX=
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

Running the CLI with no flags generates all formats into `dist/brander` and writes both light and dark theme CSS.

```
dist/
  brander/
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
  --primary-500: oklch(0.65 0.2 45);
  --neutral-50: oklch(0.97 0.02 95);
}
```

Usage:

```css
:root {
  --background: var(--neutral-50);
  --text: var(--neutral-950);
}
```

By default, Brander emits unprefixed variables for broader compatibility. If you want namespaced output, use `css.prefix` in `brand.config.ts`, `CSS_PREFIX` in `.env`, or `--prefix ac` on the CLI.

---

# Theme Tokens

Example:

```css
:root {
  --background: var(--neutral-50);
  --surface: var(--neutral-100);
  --text: var(--neutral-950);
  --muted: var(--neutral-100);
  --card: var(--neutral-50);
  --border: var(--neutral-200);
  --primary: var(--primary-600);
  --primary-foreground: var(--neutral-50);
}

[data-theme="dark"] {
  --background: var(--neutral-950);
  --surface: var(--neutral-900);
  --text: var(--neutral-50);
}
```

Core semantic tokens include `background`, `surface`, `text`, `muted`, `card`, `popover`, `border`, `input`, `ring`, `primary`, `secondary`, `accent`, `info`, `success`, `warning`, and `danger`, each with matching foreground tokens where appropriate.

---

# TypeScript Tokens

Generated file:

```
dist/brander/tokens.ts
```

Usage:

```ts
import { tokens, metadata } from "./dist/brander/tokens";

console.log(tokens.color.semantic.light.primary.value);
console.log(metadata.adapters);
```

This output is intended for typed apps, scripts, and build-time tooling.

---

# SCSS Tokens

Generated file:

```
dist/brander/tokens.scss
```

Usage:

```scss
@use "./dist/brander/tokens.scss" as tokens;

.button {
  background: tokens.$primary;
  color: tokens.$primary-foreground;
}
```

Light semantic tokens are emitted as Sass variables like `$background`, and dark semantic tokens are emitted as `$dark-background`. Prefixing works here too when configured.

---

# Tailwind Integration

Generated preset:

```
dist/brander/adapters/tailwind.preset.ts
```

Usage:

```ts
import preset from "./dist/brander/adapters/tailwind.preset";

export default {
  presets: [preset]
};
```

Use tokens in Tailwind:

```
bg-primary
text-danger
border-secondary
```

---

# Bootstrap / SCSS Frameworks

Generated file:

```
dist/brander/adapters/bootstrap.variables.scss
```

Example output:

```scss
@use "../tokens.scss" as tokens;

$primary: tokens.$primary;
$secondary: tokens.$secondary;
$info: tokens.$info;
```

---

# Figma Token Export

Generated:

```
dist/brander/adapters/figma.tokens.json
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
dist/brander/metadata.json
```

Example:

```json
{
  "version": "0.1.0",
  "generated": "2026-03-08T17:47:26.019Z",
  "themes": ["light", "dark"],
  "adapters": ["tailwind", "bootstrap", "figma"],
  "artifacts": ["tokens.css", "themes/light.css", "themes/dark.css"],
  "cssPrefix": ""
}
```

---

# Testing In Another Project

The recommended real-world test flow is to install Brander as a `devDependency` in another app using a packed tarball.

Why `devDependency`:

* Brander is a build-time code generation tool
* your app needs the generated token files at runtime, not the generator itself

Build and pack Brander:

```bash
npm run build
npm pack --pack-destination /tmp
```

Then install it into another project such as `advantacode-starter`:

```bash
cd ../advantacode-starter
npm i -D /tmp/advantacode-brander-0.1.0.tgz
```

Add a script to the app:

```json
{
  "scripts": {
    "brand:generate": "advantacode-brander --out src/brander --format css,json,typescript --theme both"
  }
}
```

Or let Brander do that setup explicitly:

```bash
npx --package @advantacode/brander advantacode-brander setup --out src/brander --style src/style.css
```

That command:

* creates `brand.config.ts` if it does not exist
* adds `brand:generate` to `package.json` if it is missing
* adds token CSS imports to the chosen stylesheet
* runs token generation

Add `brand.config.ts` to the app root:

```ts
export default {
  name: process.env.COMPANY_NAME || "AdvantaCode",
  css: {
    prefix: process.env.CSS_PREFIX ?? ""
  },
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

Import the generated CSS into the app stylesheet:

```css
@import '@/brander/tokens.css';
@import '@/brander/themes/light.css';
@import '@/brander/themes/dark.css';
```

If you use `setup`, Brander can add these imports automatically. It will try to detect common stylesheet paths, or you can pass `--style <path>` explicitly.

Generate the files:

```bash
npm run brand:generate
```

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

Brander should be published with compiled `dist/` files included in the npm package, but `dist/` does not need to be committed to git.

Current package behavior:

* `dist/` stays in `.gitignore`
* `npm run build` cleans and rebuilds compiled CLI files
* `package.json` limits publish contents to compiled JavaScript plus docs and license
* generated sample token artifacts are not published

Verify what npm will publish:

```bash
npm run release:check
```

`release:check` runs linting, the test suite, and then the npm pack dry run. The tarball output should list compiled files such as `dist/index.js`, `dist/generate-tokens.js`, adapter modules, `README.md`, and `LICENSE`, without shipping any local `dist/brander` output.

---

# Support This Project

If this package saves you time, consider supporting ongoing maintenance through GitHub Sponsors or Buy Me a Coffee once those links are available.

---

# Recommended Project Structure

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
git clone https://github.com/advantacode/advantacode-brander.git
cd advantacode-brander
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

# Lint

Lint only the repository source and tests:

```bash
npm run lint
```

Generated output folders such as `dist/brander` or `src/brander` are intentionally excluded.

---

# Test

Run the integration suite against the built CLI:

```bash
npm test
```

The current tests cover:

* `--help` CLI output
* token generation into the default `dist/brander` folder
* `setup` creating config, scripts, and stylesheet imports for `src/brander`
* invalid config failures returning clean error messages

---

# Run Token Generator

```
npm run tokens
```

---

# Local CLI Testing

You can test the CLI locally without publishing.

```bash
npm run build
npm run cli
```

To test the real npm-consumer flow, prefer packing the package and installing the tarball in another project:

```bash
npm run build
npm pack --pack-destination /tmp
```

Then install it as a `devDependency` in another app:

```bash
cd ../advantacode-starter
npm i -D /tmp/advantacode-brander-0.1.0.tgz
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
    "rootDir": "src",
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
#!/usr/bin/env -S node --import tsx/esm
```

---

# Roadmap

Planned improvements:

* automatic Tailwind palette generation
* design token standard support
* framework plugins
* optional semantic packs for charts, dashboards, and app shells

---

# Ecosystem

AdvantaCode Brander is part of the AdvantaCode ecosystem.

```
@advantacode/brander
advantacode-init
advantacode-starter
```

This allows developers to bootstrap fully branded applications with a single command.

---

# License

MIT License

---

# Author

Anthony Penn
AdvantaCode
