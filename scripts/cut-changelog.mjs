import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (value === "--version") {
      args.version = argv[index + 1];
      index += 1;
      continue;
    }

    if (value === "--date") {
      args.date = argv[index + 1];
      index += 1;
      continue;
    }

    if (value === "--help" || value === "-h") {
      args.help = true;
      continue;
    }

    args._.push(value);
  }

  return args;
}

function readPackageVersion() {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  const raw = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  if (!raw.version || typeof raw.version !== "string") {
    throw new Error('Unable to read "version" from package.json.');
  }
  return raw.version;
}

function formatToday() {
  return new Date().toISOString().slice(0, 10);
}

function printHelp() {
  console.log(`Usage:
  node scripts/cut-changelog.mjs [--version <x.y.z>] [--date YYYY-MM-DD] [--dry-run]

Behavior:
  - Moves the current contents under "## [Unreleased]" into a new release section
  - Resets "## [Unreleased]" to empty placeholders
  - Defaults --version to package.json version and --date to today
`);
}

function assertValidVersion(version) {
  if (!/^\d+\.\d+\.\d+([-.][0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`Invalid version "${version}". Expected semver like 1.0.0.`);
  }
}

function assertValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date "${date}". Expected YYYY-MM-DD.`);
  }
}

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const version = args.version ?? args._[0] ?? readPackageVersion();
const date = args.date ?? formatToday();

assertValidVersion(version);
assertValidDate(date);

const changelogPath = path.resolve(process.cwd(), "CHANGELOG.md");
const changelogText = fs.readFileSync(changelogPath, "utf8");

const unreleasedHeader = "## [Unreleased]";
const unreleasedHeaderIndex = changelogText.indexOf(unreleasedHeader);
if (unreleasedHeaderIndex === -1) {
  throw new Error(`Unable to find "${unreleasedHeader}" in CHANGELOG.md.`);
}

if (changelogText.includes(`## [${version}]`)) {
  throw new Error(`CHANGELOG.md already contains a section for version ${version}.`);
}

const unreleasedLineEnd = changelogText.indexOf("\n", unreleasedHeaderIndex);
if (unreleasedLineEnd === -1) {
  throw new Error("Malformed CHANGELOG.md: Unreleased header is missing a newline.");
}

const unreleasedBodyStart = unreleasedLineEnd + 1;
const nextSectionOffset = changelogText.slice(unreleasedBodyStart).match(/\n## \[[^\]]+\]/)?.index;
const unreleasedBodyEnd =
  nextSectionOffset === undefined ? changelogText.length : unreleasedBodyStart + nextSectionOffset;

const unreleasedBody = changelogText.slice(unreleasedBodyStart, unreleasedBodyEnd);
const releasedBody = unreleasedBody.trim();

if (!releasedBody) {
  throw new Error('Nothing to release: "## [Unreleased]" is empty.');
}

const prefix = changelogText.slice(0, unreleasedBodyStart);
const suffix = changelogText.slice(unreleasedBodyEnd);

const resetUnreleasedBody = "\n### Added\n\n### Changed\n\n### Fixed\n";
const nextText =
  prefix +
  resetUnreleasedBody +
  `\n## [${version}] - ${date}\n\n` +
  `${releasedBody}\n` +
  suffix.replace(/^\n+/, "\n");

if (args.dryRun) {
  console.log(`(dry-run) Would update ${path.relative(process.cwd(), changelogPath)} with release ${version} (${date}).`);
  process.exit(0);
}

fs.writeFileSync(changelogPath, nextText);
console.log(`Updated ${path.relative(process.cwd(), changelogPath)}: released ${version} (${date}).`);

