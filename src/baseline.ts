import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { Baseline, PackageLicense } from './types';
import { baselineKey } from './types';

export const DEFAULT_BASELINE_FILE = '.license-guardian-allowlist.json';

export async function readBaseline(root: string, filename = DEFAULT_BASELINE_FILE): Promise<Baseline> {
  try {
    const raw = await fs.readFile(join(root, filename), 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.approved)) throw new Error('malformed baseline');
    return { approved: parsed.approved };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return { approved: [] };
    throw new Error(`Could not read ${filename}: ${err instanceof Error ? err.message : err}`);
  }
}

export async function writeBaseline(root: string, baseline: Baseline, filename = DEFAULT_BASELINE_FILE): Promise<void> {
  const sorted = { approved: [...new Set(baseline.approved)].sort() };
  await fs.writeFile(join(root, filename), JSON.stringify(sorted, null, 2) + '\n', 'utf8');
}

export function diffAgainstBaseline(flagged: PackageLicense[], baseline: Baseline): PackageLicense[] {
  const approved = new Set(baseline.approved);
  return flagged.filter((pkg) => !approved.has(baselineKey(pkg)));
}

export function mergeIntoBaseline(baseline: Baseline, packages: PackageLicense[]): Baseline {
  const approved = new Set(baseline.approved);
  for (const pkg of packages) approved.add(baselineKey(pkg));
  return { approved: [...approved] };
}
