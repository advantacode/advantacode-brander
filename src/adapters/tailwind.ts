import fs from "fs";
import path from "path";
import { semanticTokenNames } from "../engine/semantics.js";
import type { TokenModel } from "../engine/themes.js";

export function writeTailwindAdapter(outputDir: string, tokenModel: TokenModel) {
  const adaptersDir = path.join(outputDir, "adapters");
  let preset = `export default {\n  theme: {\n    extend: {\n      colors: {\n`;

  fs.mkdirSync(adaptersDir, { recursive: true });

  for (const semanticTokenName of semanticTokenNames) {
    if (!tokenModel.color.semantic.light[semanticTokenName]) {
      continue;
    }

    preset += `        "${semanticTokenName}": "var(--ac-${semanticTokenName})",\n`;
  }

  preset += "      }\n    }\n  }\n};\n";

  fs.writeFileSync(path.join(adaptersDir, "tailwind.preset.ts"), preset);
  return ["adapters/tailwind.preset.ts"];
}
