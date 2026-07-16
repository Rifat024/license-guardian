export interface PackageLicense {
  name: string;
  version: string;
  /** Normalized display string, e.g. "MIT", "(MIT OR Apache-2.0)", "UNKNOWN". */
  license: string;
  path: string;
}

export interface Config {
  /** SPDX identifiers/keywords that fail the build if found anywhere in a package's license string. */
  deny: string[];
  /** Whether a missing/unparseable license field should also be flagged. */
  denyUnknown: boolean;
}

export const DEFAULT_DENY_LIST = [
  'GPL-1.0',
  'GPL-2.0',
  'GPL-3.0',
  'AGPL-1.0',
  'AGPL-3.0',
  'LGPL-2.0',
  'LGPL-2.1',
  'LGPL-3.0',
  'SSPL-1.0',
  'CC-BY-NC',
  'OSL-3.0',
  'EUPL-1.1',
  'EUPL-1.2',
  'CPAL-1.0',
  'Commons-Clause',
];

export const DEFAULT_CONFIG: Config = {
  deny: DEFAULT_DENY_LIST,
  denyUnknown: true,
};

export interface ScanResult {
  packages: PackageLicense[];
  flagged: PackageLicense[];
  unapproved: PackageLicense[];
}

export interface Baseline {
  /** Set of "name@version" strings whose license has been reviewed and approved despite being flagged. */
  approved: string[];
}

export function baselineKey(pkg: Pick<PackageLicense, 'name' | 'version'>): string {
  return `${pkg.name}@${pkg.version}`;
}
