#!/usr/bin/env -S node --import tsx/esm
import { pathToFileURL } from "url";
import { generateTokens, supportedFormats, type GenerationOptions, type OutputFormat } from "./generate-tokens.js";
import { setupProject, type SetupOptions } from "./setup.js";

if (isCliEntryPoint()) {
  process.exit(await runCli(process.argv.slice(2)));
}

export async function runCli(args: string[]) {
  try {
    const command = resolveCommand(args);
    const commandArgs = command === "generate" ? args : args.slice(1);

    if (commandArgs.includes("--help") || commandArgs.includes("-h")) {
      console.log(getHelpText(command));
      return 0;
    }

    if (command === "generate") {
      await generateTokens(parseGenerateArgs(commandArgs));
      return 0;
    }

    await setupProject(parseSetupArgs(command, commandArgs));
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    return 1;
  }
}

function isCliEntryPoint() {
  const entryPoint = process.argv[1];

  return Boolean(entryPoint) && pathToFileURL(entryPoint).href === import.meta.url;
}

function resolveCommand(args: string[]) {
  const firstArg = args[0];

  if (!firstArg || firstArg.startsWith("-")) {
    return "generate" as const;
  }

  if (firstArg === "setup" || firstArg === "init") {
    return firstArg;
  }

  throw new Error(`Unknown command "${firstArg}". Use --help to see supported commands.`);
}

function parseGenerateArgs(args: string[]): GenerationOptions {
  const options: GenerationOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--out") {
      options.outputDir = getNextArgValue(arg, args, index);
      index += 1;
      continue;
    }

    if (arg === "--format") {
      options.formats = getNextArgValue(arg, args, index)
        .split(",")
        .map((value) => normalizeFormat(value.trim()));
      index += 1;
      continue;
    }

    if (arg === "--theme") {
      const themeValue = getNextArgValue(arg, args, index);

      if (!["light", "dark", "both"].includes(themeValue)) {
        throw new Error('Invalid value for --theme. Use "light", "dark", or "both".');
      }

      options.theme = themeValue as GenerationOptions["theme"];
      index += 1;
      continue;
    }

    if (arg === "--prefix") {
      options.prefix = getNextArgValue(arg, args, index);
      index += 1;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option "${arg}". Use --help to see supported flags.`);
    }
  }

  return options;
}

function parseSetupArgs(command: "setup" | "init", args: string[]): SetupOptions {
  const generateOptions = parseGenerateArgs(
    args.filter((arg) => !["--style", "--script-name", "--skip-imports", "--skip-script", "--skip-config", "--skip-generate"].includes(arg))
  );
  const options: SetupOptions = {
    command,
    ...generateOptions
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--out" || arg === "--format" || arg === "--theme" || arg === "--prefix") {
      index += 1;
      continue;
    }

    if (arg === "--style") {
      options.stylePath = getNextArgValue(arg, args, index);
      index += 1;
      continue;
    }

    if (arg === "--script-name") {
      options.scriptName = getNextArgValue(arg, args, index);
      index += 1;
      continue;
    }

    if (arg === "--skip-imports") {
      options.skipImports = true;
      continue;
    }

    if (arg === "--skip-script") {
      options.skipScript = true;
      continue;
    }

    if (arg === "--skip-config") {
      options.skipConfig = true;
      continue;
    }

    if (arg === "--skip-generate") {
      options.skipGenerate = true;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option "${arg}". Use --help to see supported flags.`);
    }
  }

  return options;
}

function getNextArgValue(flag: string, args: string[], index: number) {
  const nextArg = args[index + 1];

  if (nextArg === undefined) {
    throw new Error(`Missing value for ${flag}.`);
  }

  return nextArg;
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

function getHelpText(command: "generate" | "setup" | "init") {
  if (command === "setup" || command === "init") {
    return `AdvantaCode Brander

Usage:
  advantacode-brander ${command} [options]

Setup options:
  --out <dir>             Output directory (default: src/brander)
  --style <path>          Stylesheet file to patch with token imports
  --script-name <name>    package.json script to create (default: brand:generate)
  --skip-imports          Do not patch a stylesheet with token imports
  --skip-script           Do not add a package.json script
  --skip-config           Do not create brand.config.ts when missing
  --skip-generate         Do not run token generation after setup

Generation options:
  --format <list>         Comma-separated formats: all, css, json, typescript|ts, scss, tailwind, bootstrap, figma
  --theme <value>         Theme CSS output: light, dark, or both (default: both)
  --prefix <value>        CSS variable prefix. Use "" or omit for no prefix

Examples:
  advantacode-brander ${command}
  advantacode-brander ${command} --out src/brander
  advantacode-brander ${command} --style src/style.css
  advantacode-brander ${command} --skip-imports --skip-generate
`;
  }

  return `AdvantaCode Brander

Usage:
  advantacode-brander [options]
  advantacode-brander setup [options]
  advantacode-brander init [options]

Commands:
  setup                   Configure an existing app to use Brander
  init                    Initialize a new app for Brander-driven tokens

Options:
  -h, --help              Show this help output
  --out <dir>             Output directory (default: dist/brander)
  --format <list>         Comma-separated formats: all, css, json, typescript|ts, scss, tailwind, bootstrap, figma
  --theme <value>         Theme CSS output: light, dark, or both (default: both)
  --prefix <value>        CSS variable prefix. Use "" or omit for no prefix

Examples:
  advantacode-brander
  advantacode-brander --out src/tokens
  advantacode-brander setup --out src/brander --style src/style.css
  advantacode-brander init --out resources/brander --skip-imports
`;
}
