import fs from "fs";
import path from "path";

const brandStylesheetFileName = "brand.css";
const defaultStyleCandidates = [
  path.join("src", "style.css"),
  path.join("src", "main.css"),
  path.join("src", "index.css"),
  path.join("src", "app.css"),
  path.join("resources", "css", "app.css")
];

export type ThemeSelection = "light" | "dark" | "both";

export function syncStyleImports(stylePath: string | undefined, outputDir: string, theme: ThemeSelection = "both") {
  return ensureStyleImports(stylePath, outputDir, theme);
}

export function ensureStyleImports(stylePath: string | undefined, outputDir: string, theme: ThemeSelection = "both") {
  const resolvedStylePath = resolveStylePath(stylePath);

  if (!resolvedStylePath) {
    return {
      message:
        "Skipped stylesheet imports because no stylesheet was found. Use --style <path> to target a file explicitly."
    };
  }

  const brandStylesheetPath = path.join(path.dirname(resolvedStylePath), brandStylesheetFileName);
  const brandStylesheetImports = [buildImportLine(brandStylesheetPath, path.join(outputDir, "tokens.css"))];

  if (theme === "light" || theme === "both") {
    brandStylesheetImports.push(buildImportLine(brandStylesheetPath, path.join(outputDir, "themes", "light.css")));
  }

  if (theme === "dark" || theme === "both") {
    brandStylesheetImports.push(buildImportLine(brandStylesheetPath, path.join(outputDir, "themes", "dark.css")));
  }
  const brandStylesheetContents = `${brandStylesheetImports.join("\n")}\n`;
  const hasBrandStylesheet = fs.existsSync(brandStylesheetPath);
  const existingBrandStylesheet = hasBrandStylesheet ? fs.readFileSync(brandStylesheetPath, "utf8") : "";

  if (existingBrandStylesheet !== brandStylesheetContents) {
    fs.writeFileSync(brandStylesheetPath, brandStylesheetContents);
  }

  const styleFileContents = fs.readFileSync(resolvedStylePath, "utf8");
  const legacyTokenImports = [
    buildImportLine(resolvedStylePath, path.join(outputDir, "tokens.css")),
    buildImportLine(resolvedStylePath, path.join(outputDir, "themes", "light.css")),
    buildImportLine(resolvedStylePath, path.join(outputDir, "themes", "dark.css"))
  ];
  const brandImportLine = buildImportLine(resolvedStylePath, brandStylesheetPath);
  const styleLineEnding = styleFileContents.includes("\r\n") ? "\r\n" : "\n";
  const styleLines = styleFileContents.split(/\r?\n/);
  const legacyImportCandidates = new Set<string>();

  for (const importLine of legacyTokenImports) {
    legacyImportCandidates.add(importLine);
    legacyImportCandidates.add(importLine.replace(/'/g, '"'));
  }

  let nextStyleLines = styleLines.filter((line) => !legacyImportCandidates.has(line.trim()));
  const hasBrandImport = nextStyleLines.some(
    (line) => line.trim() === brandImportLine || line.trim() === brandImportLine.replace(/'/g, '"')
  );

  if (!hasBrandImport) {
    nextStyleLines = [brandImportLine, ...nextStyleLines];
  }

  while (nextStyleLines[0] === "") {
    nextStyleLines = nextStyleLines.slice(1);
  }

  const nextStyleContents = `${nextStyleLines.join(styleLineEnding)}${styleLineEnding}`;

  if (nextStyleContents !== styleFileContents) {
    fs.writeFileSync(resolvedStylePath, nextStyleContents);
  }

  const brandStylesheetStatus = hasBrandStylesheet ? "Updated" : "Created";
  const mainStylesheetStatus = nextStyleContents === styleFileContents ? "Kept" : "Updated";

  return {
    message: `${brandStylesheetStatus} ${path.relative(process.cwd(), brandStylesheetPath)} and ${mainStylesheetStatus.toLowerCase()} ${path.relative(process.cwd(), resolvedStylePath)} to import it.`
  };
}

export function resolveStylePath(stylePath: string | undefined) {
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
  const relativeImportPath = path
    .relative(path.dirname(stylePath), path.resolve(process.cwd(), targetPath))
    .replace(/\\/g, "/");
  const normalizedImportPath = relativeImportPath.startsWith(".") ? relativeImportPath : `./${relativeImportPath}`;

  return `@import '${normalizedImportPath}';`;
}
