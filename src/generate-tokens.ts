import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { config as loadDotEnv } from "dotenv";
import { converter } from "culori";
import { tailwindColors } from "./tailwind-colors.js";

const toOklch = converter("oklch");
const outputDir = path.resolve(process.cwd(), "dist", "generated");

const supportedColorKeys = [
  "primary",
  "secondary",
  "accent",
  "success",
  "warning",
  "danger"
] as const;

type ColorKey = (typeof supportedColorKeys)[number];
type ColorTokens = Record<ColorKey, string>;
type PartialColorTokens = Partial<Record<ColorKey, string>>;

type BrandConfig = {
  name?: string;
  colors?: PartialColorTokens;
};

const defaultColors: ColorTokens = {
  primary: "oklch(62% 0.15 240)",
  secondary: "oklch(70% 0.12 180)",
  accent: "oklch(75% 0.18 30)",
  success: "oklch(70% 0.14 145)",
  warning: "oklch(80% 0.16 85)",
  danger: "oklch(62% 0.20 25)"
};

const scaleSteps: Record<string, number> = {
  50: 0.97,
  100: 0.93,
  200: 0.87,
  300: 0.80,
  400: 0.72,
  500: 0.65,
  600: 0.57,
  700: 0.49,
  800: 0.40,
  900: 0.32,
  950: 0.24
};

loadDotEnv({ path: path.resolve(process.cwd(), ".env"), quiet: true });

const brandConfig = await loadBrandConfig();
const colors = resolveColorTokens(brandConfig);

fs.mkdirSync(outputDir, { recursive: true });
removeLegacyGeneratedFiles();

generateCssVariables();
generateTypeScriptTokens();
generateTailwindPresets();
generatePalette();

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
    const parsedColors: PartialColorTokens = {};

    for (const [colorName, colorValue] of colorEntries) {
      if (!supportedColorKeys.includes(colorName as ColorKey)) {
        throw new Error(`Unsupported color token "${colorName}" in ${path.basename(configPath)}.`);
      }

      if (typeof colorValue !== "string") {
        throw new Error(`Expected color "${colorName}" in ${path.basename(configPath)} to be a string.`);
      }

      parsedColors[colorName as ColorKey] = colorValue;
    }

    parsedConfig.colors = parsedColors;
  }

  return parsedConfig;
}

function resolveColorTokens(config: BrandConfig): ColorTokens {
  const envColorOverrides: PartialColorTokens = {
    primary: process.env.PRIMARY_COLOR,
    secondary: process.env.SECONDARY_COLOR,
    accent: process.env.ACCENT_COLOR,
    success: process.env.SUCCESS_COLOR,
    warning: process.env.WARNING_COLOR,
    danger: process.env.DANGER_COLOR
  };

  const resolvedColors: ColorTokens = {
    ...defaultColors,
    ...config.colors,
    ...stripUndefinedValues(envColorOverrides)
  };

  return normalizeColorTokens(resolvedColors);
}

function stripUndefinedValues(colors: PartialColorTokens): PartialColorTokens {
  return Object.fromEntries(
    Object.entries(colors).filter(([, colorValue]) => colorValue !== undefined)
  ) as PartialColorTokens;
}

function normalizeColorTokens(colors: ColorTokens): ColorTokens {
  return Object.fromEntries(
    Object.entries(colors).map(([colorName, colorValue]) => [colorName, normalizeColorValue(colorName, colorValue)])
  ) as ColorTokens;
}

function normalizeColorValue(colorName: string, colorValue: string): string {
  const resolvedColorValue = resolveTailwindColorToken(colorValue) ?? colorValue;
  const oklchColor = toOklch(resolvedColorValue);

  if (!oklchColor) {
    throw new Error(
      `Unable to parse color "${colorName}" with value "${colorValue}". Use a valid CSS color, OKLCH string, or Tailwind-style token like "amber-500".`
    );
  }

  return formatOklchColor(oklchColor);
}

function resolveTailwindColorToken(colorValue: string): string | undefined {
  const match = colorValue.match(/^([a-z]+)-(\d{2,3})$/);

  if (!match) {
    return undefined;
  }

  const [, colorName, rawScale] = match;
  const colorScale = Number(rawScale) as keyof (typeof tailwindColors)[keyof typeof tailwindColors];
  const palette = tailwindColors[colorName as keyof typeof tailwindColors];

  return palette?.[colorScale];
}

function formatOklchColor(color: { l?: number; c?: number; h?: number; alpha?: number }) {
  const lightness = roundComponent(color.l, 6) ?? "none";
  const chroma = roundComponent(color.c, 6) ?? "none";
  const hue = roundComponent(color.h, 3) ?? "none";
  const alpha = roundComponent(color.alpha, 3);

  return alpha !== undefined && alpha < 1
    ? `oklch(${lightness} ${chroma} ${hue} / ${alpha})`
    : `oklch(${lightness} ${chroma} ${hue})`;
}

function roundComponent(value: number | undefined, precision: number) {
  if (value === undefined) {
    return undefined;
  }

  return Number(value.toFixed(precision));
}

function removeLegacyGeneratedFiles() {
  const legacyOutputDir = path.resolve(process.cwd(), "dist");
  const legacyFiles = ["tokens.css", "tokens.ts", "tokens.json", "tailwind-preset.ts"];

  for (const legacyFile of legacyFiles) {
    fs.rmSync(path.join(legacyOutputDir, legacyFile), { force: true });
  }
}

function generateCssVariables() {
  let css = ":root {\n";

  for (const [variableName, variableValue] of Object.entries(colors)) {
    css += `  --ac-${variableName}: ${variableValue};\n`;
  }

  css += "}\n";

  fs.writeFileSync(path.join(outputDir, "tokens.css"), css);
}

function generateTypeScriptTokens() {
  let ts = "export const tokens = {\n";

  for (const [tokenName, tokenValue] of Object.entries(colors)) {
    ts += `  ${tokenName}: '${tokenValue}',\n`;
  }

  ts += "} as const;\n";

  fs.writeFileSync(path.join(outputDir, "tokens.ts"), ts);
}

function generateTailwindPresets() {
  let tailwind =
    `export default {
        theme: {
            extend: {
                colors: {
    `;

  for (const tokenName of Object.keys(colors)) {
    tailwind += `                'ac-${tokenName}': 'var(--ac-${tokenName})',\n`;
  }

  tailwind += `}
            }
        }
    }
    `;

  fs.writeFileSync(path.join(outputDir, "tailwind-preset.ts"), tailwind);
}

function generateColorScale(base: string) {
  const baseColor = toOklch(base);

  if (!baseColor) {
    throw new Error(`Unable to convert color "${base}" to oklch.`);
  }

  const scale: Record<string, string> = {};

  for (const [step, lightness] of Object.entries(scaleSteps)) {
    scale[step] = `oklch(${lightness} ${baseColor.c} ${baseColor.h})`;
  }

  return scale;
}

function generatePalette() {
  const palette: Record<string, Record<string, string>> = {};

  for (const [colorName, colorValue] of Object.entries(colors)) {
    palette[colorName] = generateColorScale(colorValue);
  }

  fs.writeFileSync(path.join(outputDir, "tokens.json"), JSON.stringify(palette, null, 2));
}
