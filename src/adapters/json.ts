import fs from "fs";
import path from "path";
import type { TokenModel } from "../engine/themes.js";

export type GeneratedMetadata = {
  version: string;
  generated: string;
  themes: string[];
  adapters: string[];
  artifacts: string[];
};

export function writeJsonArtifacts(outputDir: string, tokenModel: TokenModel, metadata: GeneratedMetadata) {
  fs.writeFileSync(path.join(outputDir, "tokens.json"), JSON.stringify(tokenModel, null, 2));
  fs.writeFileSync(path.join(outputDir, "metadata.json"), JSON.stringify(metadata, null, 2));
}
