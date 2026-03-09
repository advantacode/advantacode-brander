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
};

type BrandConfig = {
  name?: string;
  colors?: PartialBaseColors;
  css?: {
    prefix?: string;
  };
};

const defaultOutputDir = path.resolve(process.cwd(), "dist", "generated");

export async function generateTokens(options: GenerationOptions = {}) {
  const outputDir = options.outputDir ? path.resolve(process.cwd(), options.outputDir) : defaultOutputDir;
  const theme = options.theme ?? "both";
  const formats = resolveFormats(options.formats);

  loadDotEnv({ path: path.resolve(process.cwd(), ".env"), quiet: true });

  const brandConfig = await loadBrandConfig();
  const prefix = resolveCssPrefix(options.prefix, brandConfig.css?.prefix, process.env.CSS_PREFIX);
  const baseColors = resolveBaseColors(brandConfig.colors ?? {});
  const tokenModel = createTokenModel(baseColors);

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

  console.log(`✔ AdvantaCode tokens generated in ${path.relative(process.cwd(), outputDir) || "."}!`);
}

async function loadBrandConfig(): Promise<BrandConfig> {
  const configPath = findBrandConfigPath();

  if (!configPath) {
    return {};
  }

  try {
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

  return parsedConfig;
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
    adapters,
    artifacts,
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
