import fs from "fs";
import path from "path";
import type { GeneratedMetadata } from "./json.js";
import type { TokenModel } from "../engine/themes.js";

export function writeTypeScriptArtifacts(outputDir: string, tokenModel: TokenModel, metadata: GeneratedMetadata) {
  const source = `export const metadata = ${JSON.stringify(metadata, null, 2)} as const;

export const tokens = ${JSON.stringify(tokenModel, null, 2)} as const;

export type Metadata = typeof metadata;
export type Tokens = typeof tokens;
`;

  fs.writeFileSync(path.join(outputDir, "tokens.ts"), source);
}
