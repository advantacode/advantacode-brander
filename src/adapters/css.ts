import fs from "fs";
import path from "path";
import { scaleSteps, type PrimitiveColorName } from "../engine/palette.js";
import { semanticTokenNames } from "../engine/semantics.js";
import type { TokenModel } from "../engine/themes.js";

export type ThemeSelection = "light" | "dark" | "both";

export function writeCssArtifacts(outputDir: string, tokenModel: TokenModel, theme: ThemeSelection) {
  const themesDir = path.join(outputDir, "themes");
  const writtenArtifacts = ["tokens.css"];

  fs.mkdirSync(themesDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "tokens.css"), renderPrimitiveTokens(tokenModel));

  if (theme === "light" || theme === "both") {
    fs.writeFileSync(path.join(themesDir, "light.css"), renderThemeCss(":root", tokenModel, "light"));
    writtenArtifacts.push("themes/light.css");
  }

  if (theme === "dark" || theme === "both") {
    fs.writeFileSync(path.join(themesDir, "dark.css"), renderThemeCss('[data-theme="dark"]', tokenModel, "dark"));
    writtenArtifacts.push("themes/dark.css");
  }

  return writtenArtifacts;
}

function renderPrimitiveTokens(tokenModel: TokenModel) {
  let css = ":root {\n";

  for (const [colorName, scale] of Object.entries(tokenModel.color.primitive) as Array<
    [PrimitiveColorName, TokenModel["color"]["primitive"][PrimitiveColorName]]
  >) {
    for (const step of scaleSteps) {
      css += `  --ac-${colorName}-${step}: ${scale[step]};\n`;
    }
  }

  css += "}\n";

  return css;
}

function renderThemeCss(selector: string, tokenModel: TokenModel, themeName: "light" | "dark") {
  let css = `${selector} {\n`;

  for (const semanticTokenName of semanticTokenNames) {
    const token = tokenModel.color.semantic[themeName][semanticTokenName];
    css += `  --ac-${semanticTokenName}: ${toCssVariableReference(token.ref)};\n`;
  }

  css += "}\n";

  return css;
}

function toCssVariableReference(reference: string) {
  return `var(--ac-${reference.replace(".", "-")})`;
}
