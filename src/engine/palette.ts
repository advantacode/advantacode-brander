import { converter } from "culori";
import type { BaseColorName, BaseColors } from "./color-parser.js";

const toOklch = converter("oklch");

export const scaleSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export type ScaleStep = (typeof scaleSteps)[number];
export type PrimitiveColorName = BaseColorName;
export type PrimitiveReference = `${PrimitiveColorName}.${ScaleStep}`;
export type PrimitiveScale = Record<ScaleStep, string>;
export type PrimitivePalettes = Record<PrimitiveColorName, PrimitiveScale>;

const lightnessByStep: Record<ScaleStep, number> = {
  50: 0.97,
  100: 0.93,
  200: 0.87,
  300: 0.8,
  400: 0.72,
  500: 0.65,
  600: 0.57,
  700: 0.49,
  800: 0.4,
  900: 0.32,
  950: 0.24
};

export function generatePrimitivePalettes(baseColors: BaseColors): PrimitivePalettes {
  return Object.fromEntries(
    Object.entries(baseColors).map(([colorName, colorValue]) => [colorName, generatePrimitiveScale(colorValue)])
  ) as PrimitivePalettes;
}

export function resolvePrimitiveReference(palettes: PrimitivePalettes, reference: PrimitiveReference): string {
  const [colorName, rawStep] = reference.split(".");
  const step = Number(rawStep) as ScaleStep;

  return palettes[colorName as PrimitiveColorName][step];
}

function generatePrimitiveScale(baseColorValue: string): PrimitiveScale {
  const baseColor = toOklch(baseColorValue);

  if (!baseColor) {
    throw new Error(`Unable to convert color "${baseColorValue}" to oklch.`);
  }

  return Object.fromEntries(
    scaleSteps.map((step) => [step, formatOklchColor({ l: lightnessByStep[step], c: baseColor.c, h: baseColor.h })])
  ) as PrimitiveScale;
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
