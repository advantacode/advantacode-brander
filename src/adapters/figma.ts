import fs from "fs";
import path from "path";
import { scaleSteps } from "../engine/palette.js";
import { semanticTokenNames, themeNames } from "../engine/semantics.js";
import type { TokenModel } from "../engine/themes.js";

export function writeFigmaAdapter(outputDir: string, tokenModel: TokenModel) {
  const adaptersDir = path.join(outputDir, "adapters");
  const figmaTokens = {
    color: {
      primitive: Object.fromEntries(
        Object.entries(tokenModel.color.primitive).map(([colorName, scale]) => [
          colorName,
          Object.fromEntries(scaleSteps.map((step) => [step, { value: scale[step] }]))
        ])
      ),
      semantic: Object.fromEntries(
        themeNames.map((themeName) => [
          themeName,
          Object.fromEntries(
            semanticTokenNames.map((semanticTokenName) => [
              semanticTokenName,
              {
                value: tokenModel.color.semantic[themeName][semanticTokenName].value,
                ref: tokenModel.color.semantic[themeName][semanticTokenName].ref
              }
            ])
          )
        ])
      )
    }
  };

  fs.mkdirSync(adaptersDir, { recursive: true });
  fs.writeFileSync(path.join(adaptersDir, "figma.tokens.json"), JSON.stringify(figmaTokens, null, 2));
  return ["adapters/figma.tokens.json"];
}
