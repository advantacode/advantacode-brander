import fs from "fs";
import path from "path";
import { generateTokens, type GenerationOptions } from "./generate-tokens.js";

export type SetupCommand = "setup" | "init";

export type SetupOptions = GenerationOptions & {
  command: SetupCommand;
  stylePath?: string;
  scriptName?: string;
  skipImports?: boolean;
  skipScript?: boolean;
  skipConfig?: boolean;
  skipGenerate?: boolean;
};

const defaultSetupOutputDir = path.join("src", "generated", "brand");
const defaultStyleCandidates = [
  path.join("src", "style.css"),
  path.join("src", "main.css"),
  path.join("src", "index.css"),
  path.join("src", "app.css"),
  path.join("resources", "css", "app.css")
];

export async function setupProject(options: SetupOptions) {
  const resolvedOutputDir = options.outputDir ?? defaultSetupOutputDir;
  const scriptName = options.scriptName ?? "brand:generate";
  const notes: string[] = [];

  if (!options.skipConfig) {
    const configResult = ensureBrandConfig();
    notes.push(configResult.message);
  }

  if (!options.skipScript) {
    const scriptResult = ensurePackageScript(scriptName, buildGenerateCommand({
      ...options,
      outputDir: resolvedOutputDir
    }));
    notes.push(scriptResult.message);
  }

  if (!options.skipImports) {
    const styleResult = ensureStyleImports(options.stylePath, resolvedOutputDir);
    notes.push(styleResult.message);
  }

  if (!options.skipGenerate) {
    await generateTokens({
      outputDir: resolvedOutputDir,
      formats: options.formats,
      theme: options.theme,
      prefix: options.prefix
    });
    notes.push(`Generated tokens in ${resolvedOutputDir}.`);
  }

  console.log(`✔ AdvantaCode Brander ${options.command} complete.`);

  for (const note of notes) {
    console.log(`  - ${note}`);
  }
}

function ensureBrandConfig() {
  const configPath = path.resolve(process.cwd(), "brand.config.ts");

  if (fs.existsSync(configPath)) {
    return { message: "Kept existing brand.config.ts." };
  }

  fs.writeFileSync(configPath, getDefaultBrandConfigTemplate());
  return { message: "Created brand.config.ts." };
}

function ensurePackageScript(scriptName: string, command: string) {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    return { message: "Skipped package.json script update because package.json was not found." };
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
  };
  const scripts = packageJson.scripts ?? {};

  if (scripts[scriptName] === command) {
    return { message: `Kept existing "${scriptName}" script.` };
  }

  if (scriptName in scripts && scripts[scriptName] !== command) {
    return { message: `Skipped "${scriptName}" because package.json already defines it.` };
  }

  packageJson.scripts = {
    ...scripts,
    [scriptName]: command
  };

  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  return { message: `Added "${scriptName}" script to package.json.` };
}

function ensureStyleImports(stylePath: string | undefined, outputDir: string) {
  const resolvedStylePath = resolveStylePath(stylePath);

  if (!resolvedStylePath) {
    return {
      message:
        "Skipped stylesheet imports because no stylesheet was found. Use --style <path> to target a file explicitly."
    };
  }

  const styleFileContents = fs.readFileSync(resolvedStylePath, "utf8");
  const importLines = [
    buildImportLine(resolvedStylePath, path.join(outputDir, "tokens.css")),
    buildImportLine(resolvedStylePath, path.join(outputDir, "themes", "light.css")),
    buildImportLine(resolvedStylePath, path.join(outputDir, "themes", "dark.css"))
  ];
  const missingImports = importLines.filter((importLine) => !styleFileContents.includes(importLine));

  if (missingImports.length === 0) {
    return { message: `Kept existing token imports in ${path.relative(process.cwd(), resolvedStylePath)}.` };
  }

  const nextContents = `${missingImports.join("\n")}\n${styleFileContents}`;
  fs.writeFileSync(resolvedStylePath, nextContents);

  return { message: `Added token imports to ${path.relative(process.cwd(), resolvedStylePath)}.` };
}

function resolveStylePath(stylePath: string | undefined) {
  if (stylePath) {
    const candidatePath = path.resolve(process.cwd(), stylePath);

    if (!fs.existsSync(candidatePath)) {
      throw new Error(`Unable to find stylesheet "${stylePath}".`);
    }

    return candidatePath;
  }

  const existingCandidates = defaultStyleCandidates
    .map((candidate) => path.resolve(process.cwd(), candidate))
    .filter((candidatePath) => fs.existsSync(candidatePath));

  if (existingCandidates.length === 1) {
    return existingCandidates[0];
  }

  if (existingCandidates.length > 1) {
    throw new Error(
      `Multiple stylesheet candidates were found: ${existingCandidates
        .map((candidatePath) => path.relative(process.cwd(), candidatePath))
        .join(", ")}. Use --style <path> to choose one.`
    );
  }

  return undefined;
}

function buildImportLine(stylePath: string, targetPath: string) {
  const relativeImportPath = path.relative(path.dirname(stylePath), path.resolve(process.cwd(), targetPath)).replace(/\\/g, "/");
  const normalizedImportPath = relativeImportPath.startsWith(".") ? relativeImportPath : `./${relativeImportPath}`;

  return `@import '${normalizedImportPath}';`;
}

function buildGenerateCommand(options: GenerationOptions) {
  const commandParts = ["advantacode-brander"];
  const outputDir = options.outputDir ?? defaultSetupOutputDir;

  commandParts.push("--out", outputDir);

  if (options.formats && options.formats.length > 0) {
    commandParts.push("--format", options.formats.join(","));
  }

  if (options.theme && options.theme !== "both") {
    commandParts.push("--theme", options.theme);
  }

  if (options.prefix) {
    commandParts.push("--prefix", options.prefix);
  }

  return commandParts.join(" ");
}

function getDefaultBrandConfigTemplate() {
  return `export default {
  name: process.env.COMPANY_NAME || "My Company",
  css: {
    prefix: process.env.CSS_PREFIX ?? ""
  },
  colors: {
    primary: process.env.PRIMARY_COLOR || "amber-500",
    secondary: process.env.SECONDARY_COLOR || "zinc-700",
    neutral: process.env.NEUTRAL_COLOR || process.env.SECONDARY_COLOR || "zinc-700",
    accent: process.env.ACCENT_COLOR || "amber-400",
    info: process.env.INFO_COLOR || "sky-500",
    success: process.env.SUCCESS_COLOR || "green-500",
    warning: process.env.WARNING_COLOR || "yellow-500",
    danger: process.env.DANGER_COLOR || "red-500"
  }
};
`;
}
