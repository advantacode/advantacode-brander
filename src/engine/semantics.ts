import { converter } from "culori";
import { resolvePrimitiveReference, type PrimitivePalettes, type PrimitiveReference } from "./palette.js";

const toRgb = converter("rgb");

export const themeNames = ["light", "dark"] as const;
export const semanticTokenNames = [
  "background",
  "surface",
  "text",
  "muted",
  "muted-foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "border",
  "input",
  "ring",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "accent",
  "accent-foreground",
  "info",
  "info-foreground",
  "success",
  "success-foreground",
  "warning",
  "warning-foreground",
  "danger",
  "danger-foreground"
] as const;

export type ThemeName = (typeof themeNames)[number];
export type SemanticTokenName = (typeof semanticTokenNames)[number];
export type ThemeReferences = Record<ThemeName, Record<SemanticTokenName, PrimitiveReference>>;
export type ThemeValues = Record<ThemeName, Record<SemanticTokenName, string>>;

export function buildThemeReferences(palettes: PrimitivePalettes): ThemeReferences {
  const lightPrimary = "primary.600" as const;
  const darkPrimary = "primary.500" as const;
  const lightSecondary = "secondary.600" as const;
  const darkSecondary = "secondary.500" as const;
  const lightAccent = "accent.600" as const;
  const darkAccent = "accent.500" as const;
  const lightInfo = "info.600" as const;
  const darkInfo = "info.500" as const;
  const lightSuccess = "success.600" as const;
  const darkSuccess = "success.500" as const;
  const lightWarning = "warning.600" as const;
  const darkWarning = "warning.500" as const;
  const lightDanger = "danger.600" as const;
  const darkDanger = "danger.500" as const;

  return {
    light: {
      background: "neutral.50",
      surface: "neutral.100",
      text: "neutral.950",
      muted: "neutral.100",
      "muted-foreground": "neutral.700",
      card: "neutral.50",
      "card-foreground": "neutral.950",
      popover: "neutral.50",
      "popover-foreground": "neutral.950",
      border: "neutral.200",
      input: "neutral.200",
      ring: "primary.500",
      primary: lightPrimary,
      "primary-foreground": pickForegroundReference(palettes, lightPrimary),
      secondary: lightSecondary,
      "secondary-foreground": pickForegroundReference(palettes, lightSecondary),
      accent: lightAccent,
      "accent-foreground": pickForegroundReference(palettes, lightAccent),
      info: lightInfo,
      "info-foreground": pickForegroundReference(palettes, lightInfo),
      success: lightSuccess,
      "success-foreground": pickForegroundReference(palettes, lightSuccess),
      warning: lightWarning,
      "warning-foreground": pickForegroundReference(palettes, lightWarning),
      danger: lightDanger,
      "danger-foreground": pickForegroundReference(palettes, lightDanger)
    },
    dark: {
      background: "neutral.950",
      surface: "neutral.900",
      text: "neutral.50",
      muted: "neutral.900",
      "muted-foreground": "neutral.300",
      card: "neutral.900",
      "card-foreground": "neutral.50",
      popover: "neutral.900",
      "popover-foreground": "neutral.50",
      border: "neutral.800",
      input: "neutral.800",
      ring: "primary.400",
      primary: darkPrimary,
      "primary-foreground": pickForegroundReference(palettes, darkPrimary),
      secondary: darkSecondary,
      "secondary-foreground": pickForegroundReference(palettes, darkSecondary),
      accent: darkAccent,
      "accent-foreground": pickForegroundReference(palettes, darkAccent),
      info: darkInfo,
      "info-foreground": pickForegroundReference(palettes, darkInfo),
      success: darkSuccess,
      "success-foreground": pickForegroundReference(palettes, darkSuccess),
      warning: darkWarning,
      "warning-foreground": pickForegroundReference(palettes, darkWarning),
      danger: darkDanger,
      "danger-foreground": pickForegroundReference(palettes, darkDanger)
    }
  };
}

export function resolveThemeValues(palettes: PrimitivePalettes, references: ThemeReferences): ThemeValues {
  return Object.fromEntries(
    themeNames.map((themeName) => [
      themeName,
      Object.fromEntries(
        semanticTokenNames.map((semanticTokenName) => [
          semanticTokenName,
          resolvePrimitiveReference(palettes, references[themeName][semanticTokenName])
        ])
      )
    ])
  ) as ThemeValues;
}

function pickForegroundReference(palettes: PrimitivePalettes, backgroundReference: PrimitiveReference): PrimitiveReference {
  const background = resolvePrimitiveReference(palettes, backgroundReference);
  const lightForeground = "neutral.50" as const;
  const darkForeground = "neutral.950" as const;
  const lightContrast = getContrastRatio(background, resolvePrimitiveReference(palettes, lightForeground));
  const darkContrast = getContrastRatio(background, resolvePrimitiveReference(palettes, darkForeground));

  return lightContrast >= darkContrast ? lightForeground : darkForeground;
}

function getContrastRatio(leftColor: string, rightColor: string): number {
  const left = toRgb(leftColor);
  const right = toRgb(rightColor);

  if (!left || !right) {
    return 1;
  }

  const leftLuminance = getRelativeLuminance(left.r, left.g, left.b);
  const rightLuminance = getRelativeLuminance(right.r, right.g, right.b);
  const lightest = Math.max(leftLuminance, rightLuminance);
  const darkest = Math.min(leftLuminance, rightLuminance);

  return (lightest + 0.05) / (darkest + 0.05);
}

function getRelativeLuminance(red: number, green: number, blue: number) {
  const [r, g, b] = [red, green, blue].map(toLinearValue);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function toLinearValue(channel: number) {
  if (channel <= 0.04045) {
    return channel / 12.92;
  }

  return ((channel + 0.055) / 1.055) ** 2.4;
}
