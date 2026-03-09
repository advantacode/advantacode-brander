import fs from "fs";
import path from "path";
import { scaleSteps, type PrimitiveColorName } from "../engine/palette.js";
import { semanticTokenNames } from "../engine/semantics.js";
import type { TokenModel } from "../engine/themes.js";
import { getSassVariableName, type VariableOptions } from "./variables.js";

export function writeScssArtifacts(
  outputDir: string,
  tokenModel: TokenModel,
  options: { includeTokensScss: boolean; includeBootstrapAdapter: boolean; variableOptions: VariableOptions }
) {
  const adaptersDir = path.join(outputDir, "adapters");
  const writtenArtifacts: string[] = [];
  const tokensScss = renderTokensScss(tokenModel, options.variableOptions);
  const bootstrapScss = `@use "../tokens.scss" as tokens;

$body-bg: tokens.${getSassVariableName("background", options.variableOptions)};
$body-color: tokens.${getSassVariableName("text", options.variableOptions)};
$border-color: tokens.${getSassVariableName("border", options.variableOptions)};
$primary: tokens.${getSassVariableName("primary", options.variableOptions)};
$secondary: tokens.${getSassVariableName("secondary", options.variableOptions)};
$info: tokens.${getSassVariableName("info", options.variableOptions)};
$success: tokens.${getSassVariableName("success", options.variableOptions)};
$warning: tokens.${getSassVariableName("warning", options.variableOptions)};
$danger: tokens.${getSassVariableName("danger", options.variableOptions)};
$card-bg: tokens.${getSassVariableName("surface", options.variableOptions)};
`;

  fs.mkdirSync(adaptersDir, { recursive: true });

  if (options.includeTokensScss || options.includeBootstrapAdapter) {
    fs.writeFileSync(path.join(outputDir, "tokens.scss"), tokensScss);
    writtenArtifacts.push("tokens.scss");
  }

  if (options.includeBootstrapAdapter) {
    fs.writeFileSync(path.join(adaptersDir, "bootstrap.variables.scss"), bootstrapScss);
    writtenArtifacts.push("adapters/bootstrap.variables.scss");
  }

  return writtenArtifacts;
}

function renderTokensScss(tokenModel: TokenModel, variableOptions: VariableOptions) {
  let scss = "";

  for (const [colorName, scale] of Object.entries(tokenModel.color.primitive) as Array<
    [PrimitiveColorName, TokenModel["color"]["primitive"][PrimitiveColorName]]
  >) {
    for (const step of scaleSteps) {
      scss += `${getSassVariableName(`${colorName}-${step}`, variableOptions)}: ${scale[step]};\n`;
    }
  }

  scss += "\n";

  for (const semanticTokenName of semanticTokenNames) {
    scss += `${getSassVariableName(semanticTokenName, variableOptions)}: ${tokenModel.color.semantic.light[semanticTokenName].value};\n`;
  }

  scss += `\n${getSassVariableName("theme-light", variableOptions)}: (\n`;

  for (const semanticTokenName of semanticTokenNames) {
    scss += `  "${semanticTokenName}": ${getSassVariableName(semanticTokenName, variableOptions)},\n`;
  }

  scss += ");\n\n";

  for (const semanticTokenName of semanticTokenNames) {
    scss += `${getSassVariableName(`dark-${semanticTokenName}`, variableOptions)}: ${tokenModel.color.semantic.dark[semanticTokenName].value};\n`;
  }

  scss += `\n${getSassVariableName("theme-dark", variableOptions)}: (\n`;

  for (const semanticTokenName of semanticTokenNames) {
    scss += `  "${semanticTokenName}": ${getSassVariableName(`dark-${semanticTokenName}`, variableOptions)},\n`;
  }

  scss += ");\n";

  return scss;
}
