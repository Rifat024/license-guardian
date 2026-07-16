# license-guardian

Scan `node_modules` for dependency licenses and gate CI on copyleft
(GPL/AGPL/LGPL/SSPL/...) or unrecognized licenses that aren't explicitly
approved — before one ends up shipped in a commercial product without anyone
noticing.

Same "Guardian" family pattern as
[`postinstall-guardian`](https://github.com/Rifat024/postinstall-guardian) and
[`vuln-guardian`](https://github.com/Rifat024/vuln-guardian): scan → review →
approve into a committed allowlist → gate CI on anything new.

## How it works

1. `license-guardian scan` walks `node_modules` (including nested/hoisted
   copies) and reads each package's declared `license` field.
2. Anything matching the deny list (strong copyleft licenses by default) —
   or missing a license entirely — gets flagged.
3. Flagged packages are compared against `.license-guardian-allowlist.json`,
   a baseline of package versions you've reviewed and approved despite being
   flagged (e.g. a GPL tool that's dev-only and never ships, or a license
   your legal team already cleared).
4. `license-guardian ci` exits non-zero if anything flagged isn't in the
   allowlist.

A version bump drops a package out of the allowlist and re-flags it, since a
new version could change its license.

## Install

```bash
npm install --save-dev license-guardian
```

## CLI

### `license-guardian scan`

```bash
license-guardian scan --dir . --report report.md
```

### `license-guardian approve`

```bash
license-guardian approve
```

Adds every currently-flagged package to the allowlist. **Review each one for
your project's license compatibility before running this** — approving is
how you tell the tool "someone looked at this and it's fine."

### `license-guardian ci`

```bash
license-guardian ci --report license-guardian-report.md
```

Scans, writes a report, and exits 1 if anything flagged isn't approved. Run
this in CI.

### `license-guardian init-config`

```bash
license-guardian init-config
# writes .license-guardian.json
```

Writes the default deny list to a file you can edit — add or remove license
identifiers, or set `denyUnknown: false` if you don't want to flag packages
with no declared license.

### `license-guardian init-workflow`

```bash
license-guardian init-workflow
# writes .github/workflows/license-guardian.yml
```

Runs on every push/PR to `main` (a license can change with any dependency
bump) plus a daily backstop cron. Installs with `npm ci --ignore-scripts`.

## Library API

```ts
import { scan } from 'license-guardian';

const result = await scan('./my-project');
if (result.unapproved.length > 0) {
  console.log(`${result.unapproved.length} unreviewed license(s)`);
}
```

## Default deny list

```
GPL-1.0, GPL-2.0, GPL-3.0, AGPL-1.0, AGPL-3.0,
LGPL-2.0, LGPL-2.1, LGPL-3.0, SSPL-1.0, CC-BY-NC,
OSL-3.0, EUPL-1.1, EUPL-1.2, CPAL-1.0, Commons-Clause
```

Plus `UNKNOWN` (no declared license) by default — override via
`.license-guardian.json`.

## Limitations

- This is not legal advice. It flags licenses for human review; it does not
  determine whether a license is actually compatible with your project.
- A dual-license expression like `(MIT OR GPL-3.0)` is flagged even though
  the MIT side alone might be fine — the tool can't know which side you'd
  actually rely on, so it errs conservative.
- Matching is substring-based against the declared license string, not a
  full SPDX expression parser.
