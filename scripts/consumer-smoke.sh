#!/usr/bin/env bash
set -euo pipefail

stack="${1:-}"

if [[ -z "$stack" ]]; then
  echo "Usage: $0 <vite|next|nuxt>" >&2
  exit 2
fi

if [[ -z "${TARBALL:-}" ]]; then
  echo "Missing env var TARBALL (path to npm pack .tgz)." >&2
  exit 2
fi

if [[ ! -f "$TARBALL" ]]; then
  echo "TARBALL not found: $TARBALL" >&2
  exit 2
fi

work_dir="${RUNNER_TEMP:-/tmp}/advantacode-brander-consumer-${stack}"
rm -rf "$work_dir"
mkdir -p "$work_dir"
cd "$work_dir"

export CI=1

case "$stack" in
  vite)
    mkdir app
    cd app
    npm init -y >/dev/null
    npm pkg set private=true >/dev/null
    npm pkg set type=module >/dev/null
    npm pkg set scripts.build="vite build" >/dev/null

    npm install -D vite@latest typescript@latest tailwindcss@latest postcss@latest autoprefixer@latest >/dev/null
    npm install -D "$TARBALL" >/dev/null

    cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
EOF

    cat > vite.config.ts <<'EOF'
import { defineConfig } from "vite";

export default defineConfig({});
EOF

    cat > postcss.config.cjs <<'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
EOF

    mkdir -p src
    cat > index.html <<'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Brander Consumer Smoke</title>
  </head>
  <body>
    <div id="app" class="p-4 text-primary">Brander smoke test</div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
EOF

    cat > src/main.ts <<'EOF'
import "./style.css";

const app = document.getElementById("app");
if (app) {
  app.textContent = "Brander consumer smoke test";
}
EOF

    cat > src/style.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

    npm exec advantacode-brander setup --style src/style.css --out src/brander >/dev/null

    cat > tailwind.config.ts <<'EOF'
import type { Config } from "tailwindcss";
import brandPreset from "./src/brander/adapters/tailwind.preset";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  presets: [brandPreset]
} satisfies Config;
EOF

    npm run brand:generate >/dev/null
    npm run build >/dev/null
    ;;

  next)
    mkdir app
    cd app
    npm init -y >/dev/null
    npm pkg set private=true >/dev/null
    npm pkg set type=module >/dev/null
    npm pkg set scripts.build="next build" scripts.dev="next dev" scripts.start="next start" >/dev/null

    npm install next@latest react@latest react-dom@latest >/dev/null
    npm install -D typescript@latest @types/node@latest @types/react@latest @types/react-dom@latest tailwindcss@latest postcss@latest autoprefixer@latest >/dev/null
    npm install -D "$TARBALL" >/dev/null

    cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve"
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
EOF

    cat > next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
EOF

    cat > postcss.config.cjs <<'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
EOF

    mkdir -p app
    cat > app/globals.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

    cat > app/layout.tsx <<'EOF'
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

    cat > app/page.tsx <<'EOF'
export default function Home() {
  return <main className="p-4 text-primary">Brander smoke test</main>;
}
EOF

    npm exec advantacode-brander setup --style app/globals.css --out app/brander >/dev/null

    cat > tailwind.config.ts <<'EOF'
import type { Config } from "tailwindcss";
import brandPreset from "./app/brander/adapters/tailwind.preset";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  presets: [brandPreset]
} satisfies Config;
EOF

    npm run brand:generate >/dev/null
    npm run build >/dev/null
    ;;

  nuxt)
    mkdir app
    cd app
    npm init -y >/dev/null
    npm pkg set private=true >/dev/null
    npm pkg set type=module >/dev/null
    npm pkg set scripts.build="nuxt build" scripts.dev="nuxt dev" >/dev/null

    npm install nuxt@latest >/dev/null
    npm install -D @nuxtjs/tailwindcss@latest tailwindcss@latest postcss@latest autoprefixer@latest typescript@latest >/dev/null
    npm install -D "$TARBALL" >/dev/null

    cat > nuxt.config.ts <<'EOF'
export default defineNuxtConfig({
  modules: ["@nuxtjs/tailwindcss"],
  css: ["~/assets/css/main.css"]
});
EOF

    mkdir -p assets/css
    cat > assets/css/main.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

    cat > app.vue <<'EOF'
<template>
  <main class="p-4 text-primary">Brander smoke test</main>
</template>
EOF

    npm exec advantacode-brander setup --style assets/css/main.css --out assets/brander >/dev/null

    cat > tailwind.config.ts <<'EOF'
import type { Config } from "tailwindcss";
import brandPreset from "./assets/brander/adapters/tailwind.preset";

export default {
  content: ["./app.vue", "./components/**/*.{vue,ts,js}", "./pages/**/*.{vue,ts,js}"],
  presets: [brandPreset]
} satisfies Config;
EOF

    npm run brand:generate >/dev/null
    npm run build >/dev/null
    ;;

  *)
    echo "Unknown stack: $stack (expected vite|next|nuxt)" >&2
    exit 2
    ;;
esac

echo "Consumer smoke test OK: $stack"

