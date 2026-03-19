import fs from 'fs';
import { generateTokens, supportedFormats, type GenerationOptions, type OutputFormat } from './generate-tokens.js';
import { setupProject, type SetupOptions } from './setup.js';

type GenerateCommandOptions = GenerationOptions & {
};

export async function runCli(args: string[]): Promise<number> {
  try {
    if (args.includes('--version') || args.includes('-v')) {
      console.log(loadPackageVersion());
      return 0;
    }

    const command = resolveCommand(args);
    const commandArgs = command === "generate" && args[0] === "generate" ? args.slice(1) : command === "generate" ? args : args.slice(1);

    if (commandArgs.includes('--help') || commandArgs.includes('-h')) {
      console.log(getHelpText(command));
      return 0;
    }

    if (command === 'generate') {
      await runGenerateCommand(parseGenerateArgs(commandArgs));
      return 0;
    }

    await setupProject(parseSetupArgs(command, commandArgs));
    return 0;
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

function loadPackageVersion(): string {
  const packageJsonPath = new URL('../package.json', import.meta.url);
  if (!fs.existsSync(packageJsonPath)) return '0.0.0';
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')).version ?? '0.0.0';
}

function resolveCommand(args: string[]) {
  const firstArg = args[0];

  if (!firstArg || firstArg.startsWith("-")) {
    return "generate" as const;
  }

  if (firstArg === "generate") {
    return "generate" as const;
  }

  if (firstArg === "setup" || firstArg === "init") {
    return firstArg;
  }

  throw new Error(`Unknown command "${firstArg}". Use --help to see supported commands.`);
}

async function runGenerateCommand(options: GenerateCommandOptions) {
  await generateTokens(options);
}

function parseGenerateArgs(args: string[]): GenerateCommandOptions {
  const options: GenerateCommandOptions = {};

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

    if (arg === "--style") {
      options.stylePath = getNextArgValue(arg, args, index);
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
  --style <path>          Main stylesheet file to patch with a brand.css import
  --script-name <name>    package.json script to create (default: brand:generate)
  --skip-imports          Do not create/update brand.css or patch stylesheet imports
  --skip-script           Do not add a package.json script
  --skip-config           Do not create brand.config.js when missing
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
  -v, --version           Show the installed package version
  --out <dir>             Output directory (default: dist/brander)
  --format <list>         Comma-separated formats: all, css, json, typescript|ts, scss, tailwind, bootstrap, figma
  --theme <value>         Theme CSS output: light, dark, or both (default: both)
  --prefix <value>        CSS variable prefix. Use "" or omit for no prefix
  --style <path>          Main stylesheet file to patch with a brand.css import

Examples:
  advantacode-brander
  advantacode-brander --out src/tokens
  advantacode-brander --style src/style.css
  advantacode-brander setup --style src/style.css
  advantacode-brander init --out resources/brander --skip-imports
`;
}
