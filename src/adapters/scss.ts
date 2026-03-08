import fs from "fs";
import path from "path";
import { scaleSteps, type PrimitiveColorName } from "../engine/palette.js";
import { semanticTokenNames } from "../engine/semantics.js";
import type { TokenModel } from "../engine/themes.js";

export function writeScssAdapter(outputDir: string, tokenModel: TokenModel) {
  const adaptersDir = path.join(outputDir, "adapters");
  const tokensScss = renderTokensScss(tokenModel);
  const bootstrapScss = `@use "../tokens.scss" as tokens;

$body-bg: tokens.$ac-background;
$body-color: tokens.$ac-text;
$border-color: tokens.$ac-border;
$primary: tokens.$ac-primary;
$secondary: tokens.$ac-secondary;
$info: tokens.$ac-info;
$success: tokens.$ac-success;
$warning: tokens.$ac-warning;
$danger: tokens.$ac-danger;
$card-bg: tokens.$ac-surface;
`;

  fs.mkdirSync(adaptersDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "tokens.scss"), tokensScss);
  fs.writeFileSync(path.join(adaptersDir, "bootstrap.variables.scss"), bootstrapScss);
}

function renderTokensScss(tokenModel: TokenModel) {
  let scss = "";

  for (const [colorName, scale] of Object.entries(tokenModel.color.primitive) as Array<
    [PrimitiveColorName, TokenModel["color"]["primitive"][PrimitiveColorName]]
  >) {
    for (const step of scaleSteps) {
      scss += `$ac-${colorName}-${step}: ${scale[step]};\n`;
    }
  }

  scss += "\n";

  for (const semanticTokenName of semanticTokenNames) {
    scss += `$ac-${semanticTokenName}: ${tokenModel.color.semantic.light[semanticTokenName].value};\n`;
  }

  scss += "\n$ac-theme-light: (\n";

  for (const semanticTokenName of semanticTokenNames) {
    scss += `  "${semanticTokenName}": $ac-${semanticTokenName},\n`;
  }

  scss += ");\n\n";

  for (const semanticTokenName of semanticTokenNames) {
    scss += `$ac-dark-${semanticTokenName}: ${tokenModel.color.semantic.dark[semanticTokenName].value};\n`;
  }

  scss += "\n$ac-theme-dark: (\n";

  for (const semanticTokenName of semanticTokenNames) {
    scss += `  "${semanticTokenName}": $ac-dark-${semanticTokenName},\n`;
  }

  scss += ");\n";

  return scss;
}
