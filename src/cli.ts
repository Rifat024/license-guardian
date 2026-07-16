#!/usr/bin/env node
import { Command } from 'commander';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { scan } from './scan';
import { scanToMarkdown } from './report';
import { readBaseline, writeBaseline, mergeIntoBaseline, DEFAULT_BASELINE_FILE } from './baseline';
import { workflowYaml } from './workflowTemplate';
import { DEFAULT_CONFIG_FILE } from './config';
import { DEFAULT_DENY_LIST } from './types';

const program = new Command();

program
  .name('license-guardian')
  .description('Scan node_modules for dependency licenses and gate CI on copyleft/unknown licenses.')
  .version('0.1.0');

function writeReport(path: string | undefined, contents: string) {
  if (!path) return;
  const full = resolve(process.cwd(), path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents, 'utf8');
}

program
  .command('scan')
  .description('List dependency licenses and flag any denied/unknown ones not in the allowlist.')
  .option('-d, --dir <path>', 'project directory', '.')
  .option('-r, --report <path>', 'write a Markdown report to this path')
  .action(async (opts) => {
    const cwd = resolve(process.cwd(), opts.dir);
    const result = await scan(cwd);
    const md = scanToMarkdown(result);
    console.log(md);
    writeReport(opts.report, md);
  });

program
  .command('approve')
  .description('Add all currently-flagged packages to the allowlist (review them first!).')
  .option('-d, --dir <path>', 'project directory', '.')
  .action(async (opts) => {
    const cwd = resolve(process.cwd(), opts.dir);
    const result = await scan(cwd);
    const baseline = await readBaseline(cwd);
    const updated = mergeIntoBaseline(baseline, result.flagged);
    await writeBaseline(cwd, updated);
    console.log(`Approved ${result.unapproved.length} new package(s). ${DEFAULT_BASELINE_FILE} now tracks ${updated.approved.length} package version(s).`);
  });

program
  .command('ci')
  .description('Scan and exit non-zero if any denied/unknown license is not in the allowlist.')
  .option('-d, --dir <path>', 'project directory', '.')
  .option('-r, --report <path>', 'write a Markdown report to this path', 'license-guardian-report.md')
  .action(async (opts) => {
    const cwd = resolve(process.cwd(), opts.dir);
    const result = await scan(cwd);
    const md = scanToMarkdown(result);
    console.log(md);
    writeReport(opts.report, md);

    if (result.unapproved.length > 0) {
      process.exitCode = 1;
    }
  });

program
  .command('init-config')
  .description('Write a default .license-guardian.json (customize the deny list from here).')
  .option('-o, --out <path>', 'config file path', DEFAULT_CONFIG_FILE)
  .action((opts) => {
    const full = resolve(process.cwd(), opts.out);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, JSON.stringify({ deny: DEFAULT_DENY_LIST, denyUnknown: true }, null, 2) + '\n', 'utf8');
    console.log(`Wrote ${opts.out}`);
  });

program
  .command('init-workflow')
  .description('Write a GitHub Actions workflow that runs license-guardian on every push/PR (plus a daily backstop).')
  .option('-o, --out <path>', 'workflow file path', '.github/workflows/license-guardian.yml')
  .option('--cron <expr>', 'backstop cron schedule (UTC)', '0 6 * * *')
  .option('--node-version <version>', 'Node.js version to run under', '20')
  .action((opts) => {
    const yaml = workflowYaml({ cron: opts.cron, nodeVersion: opts.nodeVersion });
    const full = resolve(process.cwd(), opts.out);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, yaml, 'utf8');
    console.log(`Wrote ${opts.out}`);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
