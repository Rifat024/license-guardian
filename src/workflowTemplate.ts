export interface WorkflowOptions {
  cron?: string;
  nodeVersion?: string;
}

/**
 * A new or bumped dependency can introduce a copyleft license at any time,
 * so this runs on every push/PR (matching postinstall-guardian/
 * secrets-guardian) plus a daily backstop for drift from unpinned ranges.
 */
export function workflowYaml(options: WorkflowOptions = {}): string {
  const cron = options.cron ?? '0 6 * * *';
  const nodeVersion = options.nodeVersion ?? '20';

  return `name: license-guardian

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '${cron}'
  workflow_dispatch: {}

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '${nodeVersion}'

      - run: npm ci --ignore-scripts

      - name: Scan dependency licenses
        run: npx license-guardian ci
`;
}
