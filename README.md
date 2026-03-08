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
    accent: process.env.ACCENT_COLOR || "amber-400",

    success: process.env.SUCCESS_COLOR || "green-500",
    warning: process.env.WARNING_COLOR || "yellow-500",
    danger: process.env.DANGER_COLOR || "red-500"
  }
};
```

---

# Environment Variables

Brander supports environment variables via `.env`.

Example:

```
COMPANY_NAME=AdvantaCode
PRIMARY_COLOR=amber-500
SECONDARY_COLOR=zinc-700
ACCENT_COLOR=amber-400
SUCCESS_COLOR=green-500
WARNING_COLOR=yellow-500
DANGER_COLOR=red-500
```

---

# Generated Outputs

Running the CLI generates multiple outputs.

```
tokens/
   tokens.css
   tokens.ts
   tokens.json

framework/
   tailwind.preset.ts
   quasar.variables.scss
   figma.tokens.json
```

---

# CSS Variables

Example generated `tokens.css`:

```css
:root {
  --ac-primary: oklch(0.65 0.2 45);
  --ac-secondary: oklch(0.57 0.05 260);
}
```

Usage:

```css
button {
  background: var(--ac-primary);
}
```

---

# TypeScript Tokens

Example:

```ts
export const tokens = {
  primary: "oklch(0.65 0.2 45)",
  secondary: "oklch(0.57 0.05 260)"
} as const;
```

---

# Tailwind Integration

Generated preset:

```
framework/tailwind.preset.ts
```

Usage:

```ts
import preset from "./framework/tailwind.preset";

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

# Quasar Integration

Generated file:

```
framework/quasar.variables.scss
```

Example output:

```scss
$primary: var(--ac-primary);
$secondary: var(--ac-secondary);
$accent: var(--ac-accent);
```

---

# Figma Token Export

Generated:

```
framework/figma.tokens.json
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

# Recommended Project Structure

```
my-app
│
├─ brand.config.ts
├─ .env
│
├─ tokens
│  ├─ tokens.css
│  ├─ tokens.ts
│  └─ tokens.json
│
├─ framework
│  ├─ tailwind.preset.ts
│  ├─ quasar.variables.scss
│  └─ figma.tokens.json
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
