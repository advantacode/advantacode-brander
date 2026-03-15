import { generatePrimitivePalettes, type PrimitivePalettes, type PrimitiveReference } from "./palette.js";
import {
  buildThemeReferences,
  resolveThemeValues,
  type SemanticTokenName,
  type ThemeName,
  type ThemeReferences,
  type ThemeValues
} from "./semantics.js";
import type { BaseColors } from "./color-parser.js";

export type TypographyTokens = {
  fontSans?: { value: string };
  fontMono?: { value: string };
};

export type SpacingTokens = Record<string, { value: string }>;

export type TokenModel = {
  color: {
    primitive: PrimitivePalettes;
    semantic: Record<
      ThemeName,
      Record<
        SemanticTokenName,
        {
          ref: PrimitiveReference;
          value: string;
        }
      >
    >;
  };
  typography?: TypographyTokens;
  spacing?: SpacingTokens;
};

export function createTokenModel(
  baseColors: BaseColors,
  extras?: {
    typography?: { fontSans?: string; fontMono?: string } | undefined;
    spacing?: Record<string, string> | undefined;
  }
): TokenModel {
  const primitivePalettes = generatePrimitivePalettes(baseColors);
  const themeReferences = buildThemeReferences(primitivePalettes);
  const themeValues = resolveThemeValues(primitivePalettes, themeReferences);

  const tokenModel: TokenModel = {
    color: {
      primitive: primitivePalettes,
      semantic: {
        light: mapThemeTokens(themeReferences.light, themeValues.light),
        dark: mapThemeTokens(themeReferences.dark, themeValues.dark)
      }
    }
  };

  if (extras?.typography) {
    const typography: TypographyTokens = {};
    const fontSans = extras.typography.fontSans;
    const fontMono = extras.typography.fontMono;

    if (typeof fontSans === "string" && fontSans.trim()) {
      typography.fontSans = { value: fontSans.trim() };
    }

    if (typeof fontMono === "string" && fontMono.trim()) {
      typography.fontMono = { value: fontMono.trim() };
    }

    if (Object.keys(typography).length > 0) {
      tokenModel.typography = typography;
    }
  }

  if (extras?.spacing) {
    const entries = Object.entries(extras.spacing).filter(([, value]) => typeof value === "string" && value.trim());
    if (entries.length > 0) {
      tokenModel.spacing = Object.fromEntries(
        entries
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, value]) => [key, { value: value.trim() }])
      );
    }
  }

  return tokenModel;
}

function mapThemeTokens(
  references: ThemeReferences["light"],
  values: ThemeValues["light"]
) {
  return Object.fromEntries(
    Object.entries(references).map(([tokenName, reference]) => [
      tokenName,
      {
        ref: reference,
        value: values[tokenName as keyof typeof values]
      }
    ])
  ) as TokenModel["color"]["semantic"]["light"];
}
