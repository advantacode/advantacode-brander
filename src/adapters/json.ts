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

export function writeTokenModelJson(outputDir: string, tokenModel: TokenModel) {
  fs.writeFileSync(path.join(outputDir, "tokens.json"), JSON.stringify(tokenModel, null, 2));
  return ["tokens.json"];
}

export function writeMetadataJson(outputDir: string, metadata: GeneratedMetadata) {
  fs.writeFileSync(path.join(outputDir, "metadata.json"), JSON.stringify(metadata, null, 2));
  return ["metadata.json"];
}
