# AdvantaCode Brander

AdvantaCode Brander is a design token generator that produces consistent branding tokens for modern web applications.

It converts a simple configuration into reusable outputs for multiple platforms including:

* CSS variables
* TypeScript tokens
* Tailwind presets
* Bootstrap / SCSS variables
* Figma tokens

AdvantaCode Brander uses OKLCH color space to generate perceptually consistent color scales.

## Quick Start

```bash
npm install -D @advantacode/brander
npx --package @advantacode/brander advantacode-brander setup --out src/brander --style src/style.css
```

This creates `brand.config.ts`, adds a `brand:generate` script, patches your stylesheet imports, and prepares the token output folder.

AdvantaCode Brander generates design tokens and framework adapters from a single brand configuration file. It allows applications, design systems, and design tools to share a consistent source of truth for colors and semantic tokens.

For architecture, development, testing, and publishing workflows, see [docs/TECH_OVERVIEW.md](docs/TECH_OVERVIEW.md).

## Features

* Single source of truth for brand tokens
* OKLCH color scaling
* Multi-framework outputs
* CLI tool usable across any JavaScript stack
* Environment variable support
* Tailwind integration
* Design-tool exports for Figma

## Installation

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

## CLI Usage

Examples:

```text
advantacode-brander --help
advantacode-brander --version
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
* `--version`, `-v` prints the installed package version
* `--help`, `-h` prints the CLI help text

Setup commands:

* `advantacode-brander setup` configures an existing app by creating `brand.config.ts` if needed, adding a `brand:generate` script, patching a stylesheet with token imports, and generating tokens
* `advantacode-brander init` runs the same setup flow for a freshly created app and is intended to be called by a higher-level scaffolder such as `advantacode-init`

## Configuration

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

## Environment Variables

Brander supports environment variables via `.env`.

Example:

```dotenv
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

## Generated Outputs

Running the CLI with no flags generates all formats into `dist/brander` and writes both light and dark theme CSS.

```text
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

## CSS Variables

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

## Theme Tokens

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

## TypeScript Tokens

Generated file:

```text
dist/brander/tokens.ts
```

Usage:

```ts
import { tokens, metadata } from "./dist/brander/tokens";

console.log(tokens.color.semantic.light.primary.value);
console.log(metadata.adapters);
```

This output is intended for typed apps, scripts, and build-time tooling.

## SCSS Tokens

Generated file:

```text
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

## Tailwind Integration

Generated preset:

```text
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

```text
bg-primary
text-danger
border-secondary
```

## Bootstrap / SCSS Frameworks

Generated file:

```text
dist/brander/adapters/bootstrap.variables.scss
```

Example output:

```scss
@use "../tokens.scss" as tokens;

$primary: tokens.$primary;
$secondary: tokens.$secondary;
$info: tokens.$info;
```

## Figma Token Export

Generated:

```text
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

## Metadata

Generated file:

```text
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

## Ecosystem

AdvantaCode Brander is part of the AdvantaCode ecosystem.

```text
@advantacode/brander
advantacode-init
advantacode-starter
```

This allows developers to bootstrap fully branded applications with a single command.

## Contributing

AdvantaCode Brander is maintained under a closed governance model.

Issues and feature requests are welcome, but pull requests may not be accepted.

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for details.

## Trademark Notice

`AdvantaCode` and `AdvantaCode Brander` are trademarks of AdvantaCode.

The MIT license for this package does not grant permission to use the AdvantaCode name, logos, package names, domains, or branding, or to imply endorsement or affiliation.

See [docs/TRADEMARKS.md](docs/TRADEMARKS.md) for the trademark policy.

## License

MIT License. See [LICENSE](LICENSE).
