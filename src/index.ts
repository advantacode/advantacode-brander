#!/usr/bin/env -S node --import tsx/esm
import { generateTokens, supportedFormats, type GenerationOptions, type OutputFormat } from "./generate-tokens.js";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(getHelpText());
  process.exit(0);
}

const options = parseCliArgs(args);

await generateTokens(options);

function parseCliArgs(args: string[]): GenerationOptions {
  const options: GenerationOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--out") {
      const nextArg = args[index + 1];

      if (!nextArg) {
        throw new Error("Missing value for --out.");
      }

      options.outputDir = nextArg;
      index += 1;
      continue;
    }

    if (arg === "--format") {
      const nextArg = args[index + 1];

      if (!nextArg) {
        throw new Error("Missing value for --format.");
      }

      options.formats = nextArg
        .split(",")
        .map((value) => normalizeFormat(value.trim()))
        .filter((value): value is OutputFormat => value !== undefined);
      index += 1;
      continue;
    }

    if (arg === "--theme") {
      const nextArg = args[index + 1];

      if (!nextArg || !["light", "dark", "both"].includes(nextArg)) {
        throw new Error('Invalid value for --theme. Use "light", "dark", or "both".');
      }

      options.theme = nextArg as GenerationOptions["theme"];
      index += 1;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option "${arg}". Use --help to see supported flags.`);
    }
  }

  return options;
}

function normalizeFormat(value: string) {
  if (value === "ts") {
    return "typescript";
  }

  if (supportedFormats.includes(value as OutputFormat)) {
    return value as OutputFormat;
  }

  throw new Error(`Unknown format "${value}". Use --help to see supported formats.`);
}

function getHelpText() {
  return `AdvantaCode Brander

Usage:
  advantacode-brander [options]

Options:
  -h, --help              Show this help output
  --out <dir>             Output directory (default: dist/generated)
  --format <list>         Comma-separated formats: all, css, json, typescript|ts, scss, tailwind, bootstrap, figma
  --theme <value>         Theme CSS output: light, dark, or both (default: both)

Examples:
  advantacode-brander
  advantacode-brander --out src/tokens
  advantacode-brander --format css,tailwind,figma
  advantacode-brander --theme dark
`;
}
