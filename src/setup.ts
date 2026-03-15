import fs from "fs";
import path from "path";
import { generateTokens, type GenerationOptions } from "./generate-tokens.js";
import { ensureStyleImports, resolveStylePath, syncStyleImports as syncStyleImportsImpl } from "./style-imports.js";

export type SetupCommand = "setup" | "init";

export type SetupOptions = GenerationOptions & {
  command: SetupCommand;
  stylePath?: string;
  scriptName?: string;
  skipImports?: boolean;
  skipScript?: boolean;
  skipConfig?: boolean;
  skipGenerate?: boolean;
};

const defaultSetupOutputDir = path.join("src", "brander");

export async function setupProject(options: SetupOptions) {
  const resolvedOutputDir = options.outputDir ?? defaultSetupOutputDir;
  const scriptName = options.scriptName ?? "brand:generate";
  const notes: string[] = [];
  const resolvedStylePath = !options.skipImports ? resolveStylePath(options.stylePath) : undefined;
  const configFormats = options.formats && options.formats.length > 0 ? options.formats : undefined;

  if (!options.skipConfig) {
    const configResult = ensureBrandConfig({
      outputDir: resolvedOutputDir,
      styleFile: resolvedStylePath ? normalizeConfigPath(path.relative(process.cwd(), resolvedStylePath)) : undefined,
      formats: configFormats,
      adapters: !configFormats ? ["tailwind"] : undefined,
      prefix: options.prefix,
      theme: options.theme
    });
    notes.push(configResult.message);
  }

  if (!options.skipScript) {
    const scriptResult = ensurePackageScript(scriptName, buildGenerateCommand({
      ...options
    }));
    notes.push(scriptResult.message);
  }

  if (!options.skipImports) {
    const styleResult = ensureStyleImports(
      resolvedStylePath ? normalizeConfigPath(path.relative(process.cwd(), resolvedStylePath)) : undefined,
      resolvedOutputDir,
      options.theme ?? "both"
    );
    notes.push(styleResult.message);
  }

  if (!options.skipGenerate) {
    await generateTokens({
      outputDir: resolvedOutputDir,
      formats: options.formats,
      theme: options.theme,
      prefix: options.prefix
    });
    notes.push(`Generated tokens in ${resolvedOutputDir}.`);
  }

  console.log(`✔ AdvantaCode Brander ${options.command} complete.`);

  for (const note of notes) {
    console.log(`  - ${note}`);
  }
}

export function syncStyleImports(stylePath: string | undefined, outputDir: string) {
  return syncStyleImportsImpl(stylePath, outputDir);
}

function ensurePackageScript(scriptName: string, command: string) {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    return { message: "Skipped package.json script update because package.json was not found." };
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
  };
  const scripts = packageJson.scripts ?? {};

  if (scripts[scriptName] === command) {
    return { message: `Kept existing "${scriptName}" script.` };
  }

  if (scriptName in scripts && scripts[scriptName] !== command) {
    return { message: `Skipped "${scriptName}" because package.json already defines it.` };
  }

  packageJson.scripts = {
    ...scripts,
    [scriptName]: command
  };

  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  return { message: `Added "${scriptName}" script to package.json.` };
}

function normalizeConfigPath(value: string) {
  return value.replace(/\\/g, "/");
}

function buildGenerateCommand(options: SetupOptions) {
  void options;
  return "advantacode-brander";
}

function ensureBrandConfig(options?: {
  outputDir: string;
  styleFile?: string;
  adapters?: string[];
  formats?: SetupOptions["formats"];
  prefix?: string;
  theme?: SetupOptions["theme"];
}) {
  const existingConfigPath = findExistingBrandConfigPath();

  if (existingConfigPath) {
    return { message: `Kept existing ${path.basename(existingConfigPath)}.` };
  }

  const configPath = path.resolve(process.cwd(), "brand.config.ts");
  fs.writeFileSync(configPath, getDefaultBrandConfigTemplate(options));
  return { message: `Created ${path.basename(configPath)}.` };
}

function findExistingBrandConfigPath() {
  const candidateFiles = [
    "brand.config.ts",
    "brand.config.mts",
    "brand.config.cts",
    "brand.config.js",
    "brand.config.mjs",
    "brand.config.cjs"
  ];

  for (const candidateFile of candidateFiles) {
    const candidatePath = path.resolve(process.cwd(), candidateFile);
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return undefined;
}

function getDefaultBrandConfigTemplate(options?: {
  outputDir: string;
  styleFile?: string;
  adapters?: string[];
  formats?: SetupOptions["formats"];
  prefix?: string;
  theme?: SetupOptions["theme"];
}) {
  const outDir = options?.outputDir ?? defaultSetupOutputDir;
  const adapters = options?.adapters && options.adapters.length > 0 ? options.adapters : undefined;
  const formats = options?.formats && options.formats.length > 0 ? options.formats : undefined;
  const prefix = options?.prefix ? JSON.stringify(options.prefix) : "process.env.CSS_PREFIX ?? \"\"";
  const themeLine = options?.theme && options.theme !== "both" ? `  theme: ${JSON.stringify(options.theme)},\n` : "";

  const projectLines = [
    `  project: {`,
    `    outDir: ${JSON.stringify(outDir)},`,
    ...(options?.styleFile ? [`    styleFile: ${JSON.stringify(options.styleFile)},`] : []),
    `  },`
  ].join("\n");

  return `export default {
  name: process.env.COMPANY_NAME || "My Company",
${projectLines}

${themeLine}${formats ? `  formats: ${JSON.stringify(formats)},\n` : ""}${adapters ? `  adapters: ${JSON.stringify(adapters)},\n` : ""}  css: {
    prefix: ${prefix}
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
`;
}
