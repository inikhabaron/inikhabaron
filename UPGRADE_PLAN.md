# Targeted Dependency Upgrade Plan

## Objective
Apply safe dependency upgrades only, reducing exposure to known vulnerabilities while avoiding breaking changes.

## Actions taken
- Upgraded `axios` from `^1.10.0` to `^1.17.0`.
- Updated `package-lock.json` accordingly.
- Re-ran `npm audit` and confirmed remaining vulnerabilities are transitive and/or tied to major dependency version constraints.

## Safe upgrades applied
- `axios@1.17.0`

## Remaining high-risk transitive dependencies
These vulnerabilities are currently pulled in through packages that require major dependency review or replacement:

- `next-pwa@2.6.3` → brings in `webpack@4.47.0`, which pulls `terser-webpack-plugin`, `serialize-javascript`, `ejs`, and `elliptic`.
- `react-quill@0.0.2` / `quill` → vulnerable `lodash` path, with a major upgrade to `react-quill@2.0.0` required.
- `clean-css` via `emoji-data-css` / `quill-emoji` → no fix available currently.
- `rollup` / `rollup-plugin-terser` path via `next-pwa` / `workbox-build`.
- `postcss` via `next@16.2.7` and `tailwindcss@3.4.19` (already on supported `postcss@8` line), but audit still flags historical issues.

## Recommended next steps
1. Review `next-pwa` usage and consider upgrading to a newer major version or replacing PWA support with a maintained alternative.
2. Replace `react-quill`/`quill` if possible, or migrate to a modern editor with fixed transitive dependencies.
3. Consider locking `next` to a secure supported release and/or updating it with a compatibility audit if the app is ready for a major upgrade.
4. Retest after each major dependency bump.

## Notes
- `npm audit fix` has already applied all non-breaking fixes available.
- Remaining issues are largely transitive and would require major parent package upgrades.
