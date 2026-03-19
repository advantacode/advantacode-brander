import fs from "fs";
import path from "path";
import { semanticTokenNames } from "../engine/semantics.js";
import type { TokenModel } from "../engine/themes.js";
import { getVariableReference, type VariableOptions } from "./variables.js";

export function writeTailwindAdapter(outputDir: string, tokenModel: TokenModel, variableOptions: VariableOptions) {
  const adaptersDir = path.join(outputDir, "adapters");
  let preset = `export default {\n  theme: {\n    extend: {\n`;

  fs.mkdirSync(adaptersDir, { recursive: true });

  preset += "      colors: {\n";

  for (const semanticTokenName of semanticTokenNames) {
    if (!tokenModel.color.semantic.light[semanticTokenName]) {
      continue;
    }

    preset += `        "${semanticTokenName}": "${getVariableReference(semanticTokenName, variableOptions)}",\n`;
  }

  preset += "      },\n";

  if (tokenModel.spacing && Object.keys(tokenModel.spacing).length > 0) {
    preset += "      spacing: {\n";

    for (const spaceName of Object.keys(tokenModel.spacing)) {
      preset += `        "${spaceName}": "${getVariableReference(`space-${spaceName}`, variableOptions)}",\n`;
    }

    preset += "      },\n";
  }

  const fontSans = tokenModel.typography?.fontSans?.value;
  const fontMono = tokenModel.typography?.fontMono?.value;

  if (fontSans || fontMono) {
    preset += "      fontFamily: {\n";

    if (fontSans) {
      preset += `        "sans": ["${getVariableReference("font-sans", variableOptions)}"],\n`;
    }

    if (fontMono) {
      preset += `        "mono": ["${getVariableReference("font-mono", variableOptions)}"],\n`;
    }

    preset += "      },\n";
  }

  preset += "    }\n  }\n};\n";

  fs.writeFileSync(path.join(adaptersDir, "tailwind.preset.ts"), preset);
  return ["adapters/tailwind.preset.ts"];
}
