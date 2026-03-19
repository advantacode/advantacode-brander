import fs from "fs";
import path from "path";
import { pathToFileURL, fileURLToPath } from "url";
import { config as loadDotEnv } from "dotenv";
import { writeCssArtifacts, type ThemeSelection } from "./adapters/css.js";
import { writeFigmaAdapter } from "./adapters/figma.js";
import { writeMetadataJson, writeTokenModelJson, type GeneratedMetadata } from "./adapters/json.js";
import { writeScssArtifacts } from "./adapters/scss.js";
import { writeTailwindAdapter } from "./adapters/tailwind.js";
import { writeTypeScriptArtifacts } from "./adapters/typescript.js";
import { normalizeVariablePrefix } from "./adapters/variables.js";
import { baseColorNames, resolveBaseColors, type PartialBaseColors } from "./engine/color-parser.js";
import { createTokenModel } from "./engine/themes.js";
import { syncStyleImports } from "./style-imports.js";

export const supportedFormats = [
  "all",
  "css",
  "json",
  "typescript",
  "scss",
  "tailwind",
  "bootstrap",
  "figma"
] as const;

export type OutputFormat = (typeof supportedFormats)[number];

export type GenerationOptions = {
  outputDir?: string;
  formats?: OutputFormat[];
  theme?: ThemeSelection;
  prefix?: string;
  stylePath?: string;
};

type BrandConfig = {
  name?: string;
  project?: {
    outDir?: string;
    styleFile?: string;
  };
  adapters?: Array<"tailwind" | "bootstrap" | "figma">;
  formats?: OutputFormat[];
  theme?: ThemeSelection;
  colors?: PartialBaseColors;
  css?: {
    prefix?: string;
  };
  typography?: {
    fontSans?: string;
    fontMono?: string;
  };
  spacing?: Record<string, string>;
};

export async function generateTokens(options: GenerationOptions = {}) {
  loadDotEnv({ path: path.resolve(process.cwd(), ".env"), quiet: true });

  const brandConfig = await loadBrandConfig();
  const defaultOutputDir = resolveDefaultOutputDir();
  const outputDir = resolveOutputDir(options.outputDir, brandConfig.project?.outDir, defaultOutputDir);
  const theme = options.theme ?? brandConfig.theme ?? "both";
  const formats = resolveFormats(options.formats ?? brandConfig.formats ?? resolveFormatsFromAdapters(brandConfig.adapters));
  const prefix = resolveCssPrefix(options.prefix, brandConfig.css?.prefix, process.env.CSS_PREFIX);
  const baseColors = resolveBaseColors(brandConfig.colors ?? {});
  const tokenModel = createTokenModel(baseColors, {
    typography: resolveTypographyConfig(brandConfig.typography),
    spacing: brandConfig.spacing
  });

  fs.mkdirSync(outputDir, { recursive: true });

  if (outputDir === defaultOutputDir) {
    removeLegacyGeneratedFiles();
  }

  removeManagedArtifacts(outputDir);

  const writtenArtifacts: string[] = [];
  const writtenAdapters: string[] = [];
  const variableOptions = { prefix };

  if (formats.has("css")) {
    writtenArtifacts.push(...writeCssArtifacts(outputDir, tokenModel, theme, variableOptions));
  }

  if (formats.has("json")) {
    writtenArtifacts.push(...writeTokenModelJson(outputDir, tokenModel));
  }

  if (formats.has("scss") || formats.has("bootstrap")) {
    writtenArtifacts.push(
      ...writeScssArtifacts(outputDir, tokenModel, {
        includeTokensScss: formats.has("scss"),
        includeBootstrapAdapter: formats.has("bootstrap"),
        variableOptions
      })
    );
  }

  if (formats.has("tailwind")) {
    writtenArtifacts.push(...writeTailwindAdapter(outputDir, tokenModel, variableOptions));
    writtenAdapters.push("tailwind");
  }

  if (formats.has("bootstrap")) {
    writtenAdapters.push("bootstrap");
  }

  if (formats.has("figma")) {
    writtenArtifacts.push(...writeFigmaAdapter(outputDir, tokenModel));
    writtenAdapters.push("figma");
  }

  const plannedArtifacts = [...new Set([...writtenArtifacts, ...(formats.has("typescript") ? ["tokens.ts"] : []), "metadata.json"])];
  const metadata = createGeneratedMetadata(theme, writtenAdapters, plannedArtifacts, prefix);

  if (formats.has("typescript")) {
    writtenArtifacts.push(...writeTypeScriptArtifacts(outputDir, tokenModel, metadata));
  }

  writtenArtifacts.push(...writeMetadataJson(outputDir, metadata));

  const stylePath = options.stylePath ?? brandConfig.project?.styleFile;
  if (stylePath && formats.has("css")) {
    syncStyleImports(stylePath, outputDir, theme);
  }

  console.log(`✔ AdvantaCode tokens generated in ${path.relative(process.cwd(), outputDir) || "."}!`);
}

async function loadBrandConfig(): Promise<BrandConfig> {
  const configPath = findBrandConfigPath();

  if (!configPath) {
    return {};
  }

  try {
    // enable TS config loading if needed
    if (configPath.endsWith(".ts") || configPath.endsWith(".mts") || configPath.endsWith(".cts")) {
      await import("tsx/esm");
    }

    const importedConfig = await import(pathToFileURL(configPath).href);
    return parseBrandConfig(importedConfig.default ?? importedConfig, configPath);

  } catch (error) {
    throw new Error(`Failed to load ${path.basename(configPath)}.\n${String(error)}`);
  }
}

function findBrandConfigPath(): string | undefined {
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

function parseBrandConfig(rawConfig: unknown, configPath: string): BrandConfig {
  if (typeof rawConfig !== "object" || rawConfig === null || Array.isArray(rawConfig)) {
    throw new Error(`Expected ${path.basename(configPath)} to export an object.`);
  }

  const config = rawConfig as Record<string, unknown>;
  const parsedConfig: BrandConfig = {};

  if ("name" in config && config.name !== undefined) {
    if (typeof config.name !== "string") {
      throw new Error(`Expected "name" in ${path.basename(configPath)} to be a string.`);
    }

    parsedConfig.name = config.name;
  }

  if ("project" in config && config.project !== undefined) {
    if (typeof config.project !== "object" || config.project === null || Array.isArray(config.project)) {
      throw new Error(`Expected "project" in ${path.basename(configPath)} to be an object.`);
    }

    const projectConfig = config.project as Record<string, unknown>;
    const parsedProjectConfig: NonNullable<BrandConfig["project"]> = {};

    if ("outDir" in projectConfig && projectConfig.outDir !== undefined) {
      if (typeof projectConfig.outDir !== "string") {
        throw new Error(`Expected "project.outDir" in ${path.basename(configPath)} to be a string.`);
      }
      parsedProjectConfig.outDir = projectConfig.outDir;
    }

    if ("styleFile" in projectConfig && projectConfig.styleFile !== undefined) {
      if (typeof projectConfig.styleFile !== "string") {
        throw new Error(`Expected "project.styleFile" in ${path.basename(configPath)} to be a string.`);
      }
      parsedProjectConfig.styleFile = projectConfig.styleFile;
    }

    parsedConfig.project = parsedProjectConfig;
  }

  if ("adapters" in config && config.adapters !== undefined) {
    if (!Array.isArray(config.adapters)) {
      throw new Error(`Expected "adapters" in ${path.basename(configPath)} to be an array.`);
    }

    const parsedAdapters: NonNullable<BrandConfig["adapters"]> = [];

    for (const adapter of config.adapters) {
      if (typeof adapter !== "string") {
        throw new Error(`Expected "adapters" entries in ${path.basename(configPath)} to be strings.`);
      }

      if (!["tailwind", "bootstrap", "figma"].includes(adapter)) {
        throw new Error(`Unsupported adapter "${adapter}" in ${path.basename(configPath)}.`);
      }

      parsedAdapters.push(adapter as NonNullable<BrandConfig["adapters"]>[number]);
    }

    parsedConfig.adapters = parsedAdapters;
  }

  if ("formats" in config && config.formats !== undefined) {
    if (!Array.isArray(config.formats)) {
      throw new Error(`Expected "formats" in ${path.basename(configPath)} to be an array.`);
    }

    const parsedFormats: OutputFormat[] = [];

    for (const format of config.formats) {
      if (typeof format !== "string") {
        throw new Error(`Expected "formats" entries in ${path.basename(configPath)} to be strings.`);
      }

      if (!supportedFormats.includes(format as OutputFormat)) {
        throw new Error(`Unknown format "${format}" in ${path.basename(configPath)}.`);
      }

      parsedFormats.push(format as OutputFormat);
    }

    parsedConfig.formats = parsedFormats;
  }

  if ("theme" in config && config.theme !== undefined) {
    if (typeof config.theme !== "string") {
      throw new Error(`Expected "theme" in ${path.basename(configPath)} to be a string.`);
    }

    if (!["light", "dark", "both"].includes(config.theme)) {
      throw new Error(`Invalid "theme" in ${path.basename(configPath)}. Use "light", "dark", or "both".`);
    }

    parsedConfig.theme = config.theme as ThemeSelection;
  }

  if ("colors" in config && config.colors !== undefined) {
    if (typeof config.colors !== "object" || config.colors === null || Array.isArray(config.colors)) {
      throw new Error(`Expected "colors" in ${path.basename(configPath)} to be an object.`);
    }

    const colorEntries = Object.entries(config.colors as Record<string, unknown>);
    const parsedColors: PartialBaseColors = {};

    for (const [colorName, colorValue] of colorEntries) {
      if (!baseColorNames.includes(colorName as (typeof baseColorNames)[number])) {
        throw new Error(`Unsupported color token "${colorName}" in ${path.basename(configPath)}.`);
      }

      if (typeof colorValue !== "string") {
        throw new Error(`Expected color "${colorName}" in ${path.basename(configPath)} to be a string.`);
      }

      parsedColors[colorName as keyof PartialBaseColors] = colorValue;
    }

    parsedConfig.colors = parsedColors;
  }

  if ("css" in config && config.css !== undefined) {
    if (typeof config.css !== "object" || config.css === null || Array.isArray(config.css)) {
      throw new Error(`Expected "css" in ${path.basename(configPath)} to be an object.`);
    }

    const cssConfig = config.css as Record<string, unknown>;
    const parsedCssConfig: NonNullable<BrandConfig["css"]> = {};

    if ("prefix" in cssConfig && cssConfig.prefix !== undefined) {
      if (typeof cssConfig.prefix !== "string") {
        throw new Error(`Expected "css.prefix" in ${path.basename(configPath)} to be a string.`);
      }

      parsedCssConfig.prefix = cssConfig.prefix;
    }

    parsedConfig.css = parsedCssConfig;
  }

  if ("typography" in config && config.typography !== undefined) {
    if (typeof config.typography !== "object" || config.typography === null || Array.isArray(config.typography)) {
      throw new Error(`Expected "typography" in ${path.basename(configPath)} to be an object.`);
    }

    const typographyConfig = config.typography as Record<string, unknown>;
    const parsedTypographyConfig: NonNullable<BrandConfig["typography"]> = {};

    if ("fontSans" in typographyConfig && typographyConfig.fontSans !== undefined) {
      if (typeof typographyConfig.fontSans !== "string") {
        throw new Error(`Expected "typography.fontSans" in ${path.basename(configPath)} to be a string.`);
      }

      parsedTypographyConfig.fontSans = typographyConfig.fontSans;
    }

    if ("fontMono" in typographyConfig && typographyConfig.fontMono !== undefined) {
      if (typeof typographyConfig.fontMono !== "string") {
        throw new Error(`Expected "typography.fontMono" in ${path.basename(configPath)} to be a string.`);
      }

      parsedTypographyConfig.fontMono = typographyConfig.fontMono;
    }

    parsedConfig.typography = parsedTypographyConfig;
  }

  if ("spacing" in config && config.spacing !== undefined) {
    if (typeof config.spacing !== "object" || config.spacing === null || Array.isArray(config.spacing)) {
      throw new Error(`Expected "spacing" in ${path.basename(configPath)} to be an object.`);
    }

    const spacingEntries = Object.entries(config.spacing as Record<string, unknown>);
    const parsedSpacing: NonNullable<BrandConfig["spacing"]> = {};

    for (const [spaceName, spaceValue] of spacingEntries) {
      if (!isSafeTokenKey(spaceName)) {
        throw new Error(
          `Unsupported spacing token "${spaceName}" in ${path.basename(configPath)}. Use letters, numbers, ".", "_", or "-".`
        );
      }

      if (typeof spaceValue !== "string") {
        throw new Error(`Expected spacing "${spaceName}" in ${path.basename(configPath)} to be a string.`);
      }

      parsedSpacing[spaceName] = spaceValue;
    }

    parsedConfig.spacing = parsedSpacing;
  }

  return parsedConfig;
}

function isSafeTokenKey(value: string) {
  return /^[A-Za-z0-9._-]+$/.test(value);
}

const genericFontFamilyKeywords = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "emoji",
  "math",
  "fangsong"
]);

function resolveTypographyConfig(config: BrandConfig["typography"] | undefined) {
  if (!config) {
    return undefined;
  }

  const resolved: NonNullable<BrandConfig["typography"]> = {};

  if (typeof config.fontSans === "string" && config.fontSans.trim()) {
    resolved.fontSans = normalizeFontStack(config.fontSans, "sans-serif");
  }

  if (typeof config.fontMono === "string" && config.fontMono.trim()) {
    resolved.fontMono = normalizeFontStack(config.fontMono, "monospace");
  }

  return Object.keys(resolved).length > 0 ? resolved : undefined;
}

function normalizeFontStack(fontValue: string, fallback: "sans-serif" | "monospace") {
  const trimmed = fontValue.trim();

  if (!trimmed) {
    return trimmed;
  }

  if (trimmed.includes(",")) {
    return trimmed;
  }

  if (genericFontFamilyKeywords.has(trimmed)) {
    return trimmed;
  }

  return `"${escapeCssString(trimmed)}", ${fallback}`;
}

function escapeCssString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function resolveFormats(formats: OutputFormat[] | undefined) {
  const resolvedFormats = new Set<Exclude<OutputFormat, "all">>();

  if (!formats || formats.length === 0 || formats.includes("all")) {
    resolvedFormats.add("css");
    resolvedFormats.add("json");
    resolvedFormats.add("typescript");
    resolvedFormats.add("scss");
    resolvedFormats.add("tailwind");
    resolvedFormats.add("bootstrap");
    resolvedFormats.add("figma");

    return resolvedFormats;
  }

  for (const format of formats) {
    if (format === "all") {
      continue;
    }

    resolvedFormats.add(format);
  }

  return resolvedFormats;
}

function resolveFormatsFromAdapters(adapters: BrandConfig["adapters"] | undefined) {
  if (!adapters || adapters.length === 0) {
    return undefined;
  }

  return ["css", ...adapters] as OutputFormat[];
}

function resolveOutputDir(cliOutDir: string | undefined, configOutDir: string | undefined, defaultOutputDir: string) {
  const resolvedOutDir = cliOutDir ?? configOutDir;
  return resolvedOutDir ? path.resolve(process.cwd(), resolvedOutDir) : defaultOutputDir;
}

function removeLegacyGeneratedFiles() {
  const legacyFiles = [
    path.resolve(process.cwd(), "dist", "tokens.css"),
    path.resolve(process.cwd(), "dist", "tokens.ts"),
    path.resolve(process.cwd(), "dist", "tokens.scss"),
    path.resolve(process.cwd(), "dist", "tokens.json"),
    path.resolve(process.cwd(), "dist", "metadata.json"),
    path.resolve(process.cwd(), "dist", "tailwind-preset.ts"),
    path.resolve(process.cwd(), "dist", "generated", "tailwind-preset.ts")
  ];

  for (const legacyFile of legacyFiles) {
    fs.rmSync(legacyFile, { force: true });
  }

  removeManagedArtifacts(path.resolve(process.cwd(), "dist", "generated"));
}

function resolveDefaultOutputDir() {
  return path.resolve(process.cwd(), "dist", "brander");
}

function removeManagedArtifacts(outputDir: string) {
  const managedFiles = [
    "tokens.css",
    "tokens.json",
    "tokens.ts",
    "tokens.scss",
    "metadata.json",
    path.join("themes", "light.css"),
    path.join("themes", "dark.css"),
    path.join("adapters", "tailwind.preset.ts"),
    path.join("adapters", "bootstrap.variables.scss"),
    path.join("adapters", "figma.tokens.json")
  ];

  for (const managedFile of managedFiles) {
    fs.rmSync(path.join(outputDir, managedFile), { force: true });
  }
}

function createGeneratedMetadata(
  theme: ThemeSelection,
  adapters: string[],
  artifacts: string[],
  cssPrefix: string
): GeneratedMetadata {
  const packageJsonPath = fileURLToPath(new URL("../package.json", import.meta.url));
  const packageVersion = fs.existsSync(packageJsonPath)
    ? ((JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as { version?: string }).version ?? "0.0.0")
    : "0.0.0";

  return {
    version: packageVersion,
    generated: new Date().toISOString(),
    themes: theme === "both" ? ["light", "dark"] : [theme],
    adapters: [...new Set(adapters)].sort(),
    artifacts: [...new Set(artifacts)].sort(),
    cssPrefix
  };
}

function resolveCssPrefix(
  cliPrefix: string | undefined,
  configPrefix: string | undefined,
  envPrefix: string | undefined
) {
  return normalizeVariablePrefix(cliPrefix ?? envPrefix ?? configPrefix ?? "");
}
