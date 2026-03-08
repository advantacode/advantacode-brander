import { converter } from "culori";
import { tailwindColors } from "../tailwind-colors.js";

const toOklch = converter("oklch");

export const baseColorNames = [
  "primary",
  "secondary",
  "accent",
  "info",
  "success",
  "warning",
  "danger",
  "neutral"
] as const;

export type BaseColorName = (typeof baseColorNames)[number];
export type BaseColors = Record<BaseColorName, string>;
export type PartialBaseColors = Partial<Record<BaseColorName, string>>;

const defaultBaseColors: BaseColors = {
  primary: "amber-500",
  secondary: "zinc-700",
  accent: "amber-400",
  info: "sky-500",
  success: "green-500",
  warning: "yellow-500",
  danger: "red-500",
  neutral: "zinc-700"
};

export function resolveBaseColors(colors: PartialBaseColors): BaseColors {
  const mergedColors: BaseColors = {
    ...defaultBaseColors,
    ...colors,
    neutral: colors.neutral ?? colors.secondary ?? defaultBaseColors.neutral
  };

  return Object.fromEntries(
    Object.entries(mergedColors).map(([colorName, colorValue]) => [colorName, normalizeColorValue(colorName, colorValue)])
  ) as BaseColors;
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
