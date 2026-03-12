#!/usr/bin/env node
import { runCli } from './index.js';

const args = process.argv.slice(2);

runCli(args).then((code) => process.exit(code));