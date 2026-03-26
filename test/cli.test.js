import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "..");

function createTempProject(t, files = {}) {
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "advantacode-brander-test-"));

  for (const [relativePath, contents] of Object.entries(files)) {
    const targetPath = path.join(projectDir, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, contents);
  }

  t.after(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  return projectDir;
}

async function captureCliRun(args, cwd = repoRoot) {
  const { runCli } = await import("../dist/index.js");
  const previousCwd = process.cwd();
  const stdout = [];
  const stderr = [];
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...values) => {
    stdout.push(values.join(" "));
  };

  console.error = (...values) => {
    stderr.push(values.join(" "));
  };

  try {
    process.chdir(cwd);
    const exitCode = await runCli(args);

    return {
      exitCode,
      stdout: stdout.join("\n"),
      stderr: stderr.join("\n")
    };
  } finally {
    process.chdir(previousCwd);
    console.log = originalLog;
    console.error = originalError;
  }
}

test("prints help text", async () => {
  const result = await captureCliRun(["--help"]);

  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /AdvantaCode Brander/);
  assert.match(result.stdout, /Usage:/);
});

test("prints the installed package version", async () => {
  const result = await captureCliRun(["--version"]);
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));

  assert.equal(result.exitCode, 0);
  assert.equal(result.stdout.trim(), packageJson.version);
});

test("generates requested artifacts into the default brander folder", async (t) => {
  const projectDir = createTempProject(t, {
    "brand.config.js": `export default {
  css: { prefix: "ac" },
  colors: {
    primary: "blue-500",
    secondary: "zinc-700"
  }
};
`
  });

  const result = await captureCliRun(["--format", "css,json", "--theme", "light"], projectDir);

  assert.equal(result.exitCode, 0, result.stderr);
  assert.match(result.stdout, /tokens generated in dist\/brander/i);

  const tokensCss = fs.readFileSync(path.join(projectDir, "dist", "brander", "tokens.css"), "utf8");
  const lightCss = fs.readFileSync(path.join(projectDir, "dist", "brander", "themes", "light.css"), "utf8");
  const metadata = JSON.parse(fs.readFileSync(path.join(projectDir, "dist", "brander", "metadata.json"), "utf8"));

  assert.match(tokensCss, /--ac-primary-500:/);
  assert.match(lightCss, /--ac-primary:/);
  assert.deepEqual(metadata.themes, ["light"]);
  assert.equal(metadata.cssPrefix, "ac");
  assert.deepEqual(metadata.adapters, []);
  assert.deepEqual([...metadata.artifacts].sort(), metadata.artifacts);
});

test("emits spacing and typography variables from brand.config", async (t) => {
  const projectDir = createTempProject(t, {
    "brand.config.js": `export default {
  css: { prefix: "ac" },
  colors: {
    primary: "blue-500",
    secondary: "zinc-700"
  },
  typography: {
    fontSans: "Inter",
    fontMono: "JetBrains Mono"
  },
  spacing: {
    md: "1rem",
    xl: "2rem"
  }
};
`
  });

  const result = await captureCliRun(["--format", "css,tailwind", "--theme", "light"], projectDir);

  assert.equal(result.exitCode, 0, result.stderr);

  const tokensCss = fs.readFileSync(path.join(projectDir, "dist", "brander", "tokens.css"), "utf8");
  const tailwindPreset = fs.readFileSync(
    path.join(projectDir, "dist", "brander", "adapters", "tailwind.preset.ts"),
    "utf8"
  );

  assert.match(tokensCss, /--ac-space-md:\s*1rem;/);
  assert.match(tokensCss, /--ac-space-xl:\s*2rem;/);
  assert.match(tokensCss, /--ac-font-sans:\s*"Inter",\s*sans-serif;/);
  assert.match(tokensCss, /--ac-font-mono:\s*"JetBrains Mono",\s*monospace;/);

  assert.match(tailwindPreset, /spacing:\s*\{/);
  assert.match(tailwindPreset, /"md":\s*"var\(--ac-space-md\)"/);
  assert.match(tailwindPreset, /fontFamily:\s*\{/);
  assert.match(tailwindPreset, /"sans":\s*\["var\(--ac-font-sans\)"\]/);
  assert.match(tailwindPreset, /"mono":\s*\["var\(--ac-font-mono\)"\]/);
});

test("setup uses the default src/brander output, adds a script, creates brand.css, and patches the stylesheet", async (t) => {
  const projectDir = createTempProject(t, {
    "package.json": JSON.stringify({ name: "sample-app", private: true, scripts: {} }, null, 2),
    "src/style.css": "body { color: inherit; }\n"
  });

  const result = await captureCliRun(["setup", "--style", "src/style.css", "--skip-generate"], projectDir);

  assert.equal(result.exitCode, 0, result.stderr);

  const packageJson = JSON.parse(fs.readFileSync(path.join(projectDir, "package.json"), "utf8"));
  const brandCss = fs.readFileSync(path.join(projectDir, "src", "brand.css"), "utf8");
  const styleCss = fs.readFileSync(path.join(projectDir, "src", "style.css"), "utf8");

  assert.equal(packageJson.scripts["brand:generate"], "advantacode-brander");
  assert.ok(fs.existsSync(path.join(projectDir, "brand.config.ts")));
  assert.match(styleCss, /@import '\.\/brand\.css';/);
  assert.match(brandCss, /@import '\.\/brander\/tokens\.css';/);
  assert.match(brandCss, /@import '\.\/brander\/themes\/light\.css';/);
  assert.match(brandCss, /@import '\.\/brander\/themes\/dark\.css';/);
  assert.doesNotMatch(result.stdout, /Generated tokens in/);
});

test("generate supports --style so repeated runs keep stylesheet wiring aligned", async (t) => {
  const projectDir = createTempProject(t, {
    "src/styles.css": "body { color: inherit; }\n"
  });

  const result = await captureCliRun(["--out", "src/assets/brander", "--style", "src/styles.css", "--format", "css"], projectDir);

  assert.equal(result.exitCode, 0, result.stderr);

  const brandCss = fs.readFileSync(path.join(projectDir, "src", "brand.css"), "utf8");
  const styleCss = fs.readFileSync(path.join(projectDir, "src", "styles.css"), "utf8");

  assert.match(result.stdout, /tokens generated in src\/assets\/brander/i);
  assert.match(styleCss, /@import '\.\/brand\.css';/);
  assert.match(brandCss, /@import '\.\/assets\/brander\/tokens\.css';/);
  assert.match(brandCss, /@import '\.\/assets\/brander\/themes\/light\.css';/);
  assert.match(brandCss, /@import '\.\/assets\/brander\/themes\/dark\.css';/);
});

test("loads a TypeScript brand.config.ts and uses its project defaults", async (t) => {
  const projectDir = createTempProject(t, {
    "brand.config.ts": `export default {
  project: {
    outDir: "src/assets/brand",
    styleFile: "src/style.css"
  },
  theme: "light",
  formats: ["css"],
  colors: {
    primary: "blue-500",
    secondary: "zinc-700"
  }
};
`,
    "src/style.css": "body { color: inherit; }\n"
  });

  const result = await captureCliRun([], projectDir);

  assert.equal(result.exitCode, 0, result.stderr);
  assert.ok(fs.existsSync(path.join(projectDir, "src", "assets", "brand", "tokens.css")));
  assert.ok(fs.existsSync(path.join(projectDir, "src", "assets", "brand", "themes", "light.css")));
  assert.ok(!fs.existsSync(path.join(projectDir, "src", "assets", "brand", "themes", "dark.css")));

  const brandCss = fs.readFileSync(path.join(projectDir, "src", "brand.css"), "utf8");
  const styleCss = fs.readFileSync(path.join(projectDir, "src", "style.css"), "utf8");

  assert.match(styleCss, /@import '\.\/brand\.css';/);
  assert.match(brandCss, /@import '\.\/assets\/brand\/tokens\.css';/);
  assert.match(brandCss, /@import '\.\/assets\/brand\/themes\/light\.css';/);
  assert.doesNotMatch(brandCss, /themes\/dark\.css/);
});

test("reports invalid config errors without a stack trace", async (t) => {
  const projectDir = createTempProject(t, {
    "brand.config.js": `export default {
  colors: {
    primary: 123
  }
};
`
  });

  const result = await captureCliRun([], projectDir);

  assert.equal(result.exitCode, 1);
  assert.match(result.stderr, /Expected color "primary".*to be a string/);
  assert.doesNotMatch(result.stderr, /at resolveCommand/);
  assert.doesNotMatch(result.stderr, /ModuleJob\.run/);
});
