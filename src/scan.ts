import { readBaseline, diffAgainstBaseline, DEFAULT_BASELINE_FILE } from './baseline';
import { readConfig } from './config';
import { scanNodeModules } from './scanner';
import { flagPackages } from './match';
import type { Config, ScanResult } from './types';

export interface ScanOptions {
  config?: Config;
  baselineFile?: string;
}

export async function scan(root: string, options: ScanOptions = {}): Promise<ScanResult> {
  const [packages, baseline, config] = await Promise.all([
    scanNodeModules(root),
    readBaseline(root, options.baselineFile ?? DEFAULT_BASELINE_FILE),
    options.config ? Promise.resolve(options.config) : readConfig(root),
  ]);
  const flagged = flagPackages(packages, config);
  const unapproved = diffAgainstBaseline(flagged, baseline);
  return { packages, flagged, unapproved };
}
