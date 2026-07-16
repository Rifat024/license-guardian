import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { Config } from './types';
import { DEFAULT_CONFIG } from './types';

export const DEFAULT_CONFIG_FILE = '.license-guardian.json';

/**
 * An optional project-level override for the deny list, e.g. a company that
 * also wants to block "Commercial" or a custom internal license string.
 * Missing file / missing fields fall back to DEFAULT_CONFIG.
 */
export async function readConfig(root: string, filename = DEFAULT_CONFIG_FILE): Promise<Config> {
  try {
    const raw = await fs.readFile(join(root, filename), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      deny: Array.isArray(parsed.deny) ? parsed.deny : DEFAULT_CONFIG.deny,
      denyUnknown: typeof parsed.denyUnknown === 'boolean' ? parsed.denyUnknown : DEFAULT_CONFIG.denyUnknown,
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return DEFAULT_CONFIG;
    throw new Error(`Could not read ${filename}: ${err instanceof Error ? err.message : err}`);
  }
}
