import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { config as loadDotEnv } from "dotenv";
import { writeCssArtifacts } from "./adapters/css.js";
import { writeFigmaAdapter } from "./adapters/figma.js";
import { writeJsonArtifacts, type GeneratedMetadata } from "./adapters/json.js";
import { writeScssAdapter } from "./adapters/scss.js";
import { writeTailwindAdapter } from "./adapters/tailwind.js";
import { writeTypeScriptArtifacts } from "./adapters/typescript.js";
import { baseColorNames, resolveBaseColors, type PartialBaseColors } from "./engine/color-parser.js";
import { createTokenModel } from "./engine/themes.js";

const outputDir = path.resolve(process.cwd(), "dist", "generated");

type BrandConfig = {
  name?: string;
  colors?: PartialBaseColors;
};

loadDotEnv({ path: path.resolve(process.cwd(), ".env"), quiet: true });

const brandConfig = await loadBrandConfig();
const baseColors = resolveBaseColors(brandConfig.colors ?? {});
const tokenModel = createTokenModel(baseColors);
const metadata = createGeneratedMetadata();

fs.mkdirSync(outputDir, { recursive: true });
removeLegacyGeneratedFiles();

writeCssArtifacts(outputDir, tokenModel);
writeJsonArtifacts(outputDir, tokenModel, metadata);
writeTypeScriptArtifacts(outputDir, tokenModel, metadata);
writeTailwindAdapter(outputDir, tokenModel);
writeScssAdapter(outputDir, tokenModel);
writeFigmaAdapter(outputDir, tokenModel);

console.log("✔ AdvantaCode tokens generated!");

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

  return parsedConfig;
}

function removeLegacyGeneratedFiles() {
  const legacyFiles = [
    path.resolve(process.cwd(), "dist", "tokens.css"),
    path.resolve(process.cwd(), "dist", "tokens.ts"),
    path.resolve(process.cwd(), "dist", "tokens.scss"),
    path.resolve(process.cwd(), "dist", "tokens.json"),
    path.resolve(process.cwd(), "dist", "metadata.json"),
    path.resolve(process.cwd(), "dist", "tailwind-preset.ts"),
    path.resolve(process.cwd(), "dist", "generated", "tokens.ts"),
    path.resolve(process.cwd(), "dist", "generated", "tokens.scss"),
    path.resolve(process.cwd(), "dist", "generated", "tailwind-preset.ts")
  ];

  for (const legacyFile of legacyFiles) {
    fs.rmSync(legacyFile, { force: true });
  }
}

function createGeneratedMetadata(): GeneratedMetadata {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  const packageVersion = fs.existsSync(packageJsonPath)
    ? ((JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as { version?: string }).version ?? "0.0.0")
    : "0.0.0";

  return {
    version: packageVersion,
    generated: new Date().toISOString(),
    themes: ["light", "dark"],
    adapters: ["tailwind", "bootstrap", "figma"],
    artifacts: ["tokens.css", "tokens.scss", "tokens.ts", "tokens.json", "metadata.json"]
  };
}
