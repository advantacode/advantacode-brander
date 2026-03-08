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
};

export function createTokenModel(baseColors: BaseColors): TokenModel {
  const primitivePalettes = generatePrimitivePalettes(baseColors);
  const themeReferences = buildThemeReferences(primitivePalettes);
  const themeValues = resolveThemeValues(primitivePalettes, themeReferences);

  return {
    color: {
      primitive: primitivePalettes,
      semantic: {
        light: mapThemeTokens(themeReferences.light, themeValues.light),
        dark: mapThemeTokens(themeReferences.dark, themeValues.dark)
      }
    }
  };
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
