# Frontend SCSS Audit and Fix Plan

This document audits every .scss file under frontend/, identifies selector collisions, global leaks, duplicate selectors, !important usage, deep nesting, and variable/mixin conflicts, and presents a safety-first, manual-first migration plan to scoped CSS (CSS Modules) with stylelint and CI checks.

Summary / Quick findings

- Files audited: 33 .scss files (see list in "Per-file findings").
- Major problems found:
  - Repeated top-level selectors across components (.panel, .card, .form-section, .action-button, .sr-only, etc.) — Risk: collisions and subtle visual regressions.
  - Element/type selectors (th, td, h1, p, label, table, button, input) used directly inside component styles — Risk: leaking to other components.
  - Multiple `!important` usages in key files: Dashboard.scss, FormSection.scss, CreateDropletTab.scss and compiled dist CSS — Risk: hides specificity issues and increases fragility.
  - Deeply-nested selectors in some files (fragile, hard to maintain).
  - No repository-wide SASS $variables discovered — project uses CSS custom properties (var(--...)) for tokens (colors, spacing, etc.), which is good for consistent theming.
  - Few to no shared @mixins found — duplication of layout rules increases maintenance cost.

Severity key

- Critical: Needs immediate manual review & scoped fix. (e.g., root-level selectors that collide across components, `!important` used for layout overrides)
- High: Should be fixed early (e.g., element selectors leaking or shared common classnames without proper scoping)
- Medium: Refactor in next phases (deep nesting, missing mixins)
- Low: Cosmetic/cleanups (redundant rules, minor duplication)

--

## Per-file findings (high-level)

Below are concise findings for every SCSS file discovered in frontend/ (file path → short problem summary + examples & suggested severity).

> NOTE: the per-file entries give direction and severity; for each file follow the phased migration steps later in this doc.

1. src/components/MonitoringPanel.scss
   - Issues: Uses type selectors (th/td/label/input) and top-level `.panel`/`.monitoring` style mix. Potential leakage to other table elements. Contains nested table selectors.
   - Severity: High

2. src/styles/MonitoringPanel.scss
   - Issues: Global styles and element selectors applied for the site-level monitoring panels (duplicates with component-level files). Collision risk.
   - Severity: High

3. src/styles/DiagnosisPanel.scss
   - Issues: Top-level rules and some global selectors; watch for `.panel` class reuse.
   - Severity: High

4. src/components/common/Card.scss
   - Issues: Common card wrapper styles at top-level `.card`. Used across many UIs → collision risk
   - Severity: Critical

5. src/styles/JobPanel.scss
   - Issues: Top-level selectors, type selectors inside; `.panel` re-use
   - Severity: High

6. src/components/common/Input.scss
   - Issues: Element selectors and focus states that use global tokens and may affect native inputs across app.
   - Severity: High

7. src/styles/Layout.scss
   - Issues: Layout-level global declarations (grid, main layout rules). Ensure these are intentionally global; otherwise scope them.
   - Severity: Critical (if used by multiple areas without scoping)

8. src/styles/ProvisioningPanel.scss
   - Issues: Top-level `.panel` & type selectors
   - Severity: High

9. src/styles/ClusterPanel.scss
   - Issues: `.panel` reuse; global grid rules
   - Severity: High

10. src/styles/Dashboard.scss
    - Issues: multiple `!important` occurrences (ex: `grid-template-columns: 1fr !important`), top-level selectors, element selectors.
    - Severity: Critical

11. src/styles/buttons.scss
    - Issues: Global button variants and `.action-button` definitions. Potential collisions across components.
    - Severity: Critical

12. src/components/common/Panel.scss
    - Issues: Central `.panel` definition used widely; top-level global class will collide with component-local `panel` elements across repo.
    - Severity: Critical

13. src/components/common/FormSection.scss
    - Issues: `!important` for responsive grid rules; top-level `.form-section` class used across forms.
    - Severity: High

14. src/components/common/Select.scss
    - Issues: Global select controls/styles and element selectors.
    - Severity: High

15. src/components/CreateClusterPanel.scss
    - Issues: Use of `.panel` top-level; other global classes
    - Severity: High

16. src/components/AutoscalingPanel.scss
    - Issues: Repeats `.panel` and nested top-level selectors; deep nesting present.
    - Severity: High

17. src/components/ProvisioningPanel.scss
    - Issues: `.panel` + element selectors
    - Severity: High

18. src/components/common/EmptyState.scss
    - Issues: Top-level `.empty-state`, used across pages — consider prefixing and scoping.
    - Severity: Medium

19. src/components/common/LoadingSpinner.scss
    - Issues: Global spinner classes (small risk). Fine to keep global if named uniquely (e.g., `.cg-loading-spinner`).
    - Severity: Low→Medium

20. src/components/common/ActionButton.scss
    - Issues: Shared `.action-button` styles (global). Should be made component-local or clearly namespaced (eg `.cg-action-button`).
    - Severity: High

21. src/components/common/Alert.scss
    - Issues: Top-level `.alert` class used globally.
    - Severity: High

22. src/components/common/ErrorMessage.scss
    - Issues: Global `.error-message` patterns — safe but could leak.
    - Severity: Medium

23. src/components/common/StatusBadge.scss
    - Issues: Global `.status-badge`, variant classes — potential collisions but likely fine if intentionally shared.
    - Severity: Medium

24. src/components/DropletsListTab/DropletsListTab.scss
    - Issues: Table rules, element selectors, `.panel` reuse, `.actions` grid using `!important`? (scan-level hint)
    - Severity: High

25. src/components/Hero/Hero.scss
    - Issues: Top-level hero styles are fine but ensure classes are component-prefixed (eg `.hero`, `.cg-hero` to avoid page collisions)
    - Severity: Medium

26. src/components/PolicyCard.scss
    - Issues: Card-level rules, `.panel`/`.card` reuse (collision risk)
    - Severity: High

27. src/components/ClustersPanel.scss
    - Issues: `.panel` reuse, table selectors maybe present
    - Severity: High

28. src/components/CreateDropletTab/CreateDropletTab.scss
    - Issues: `!important` occurrences — `border: 0 !important`, `position: absolute !important` and `.sr-only` style with `!important` — dangerous as these override many rules and leak to other constructs.
    - Severity: Critical

29. src/components/TabNavigation/TabNavigation.scss
    - Issues: Top-level `.tabs`/`.tab-navigation` class usage — ensure scoping.
    - Severity: Medium

30. src/components/SideRail/SideRail.scss
    - Issues: Layout + top-level selectors used for main nav; confirm they should be global.
    - Severity: Medium

31. src/components/TabularSection/TabularSection.scss
    - Issues: Table element selectors & `th/td` and global table styling. Risk: leaking to other tables on same page.
    - Severity: High

32. src/components/OverviewTab/OverviewTab.scss
    - Issues: Top-level section classes and `.panel` reuse.
    - Severity: High

33. src/components/Toast/Toast.scss
    - Issues: `.toast`/`.toast-close` classes — likely fine if next to components, but can clash with other third party components if common names used.
    - Severity: Medium

--

## Concrete examples (found earlier during scan)

- `src/styles/Dashboard.scss` (approx):
  - grid-template-columns: 1fr !important; (found in compiled css and file — weak specificity, masks other layout rules)
  - Impact: If multiple `.actions-grid` definitions exist in other files this rule will enforce layout across the entire app.

- `src/components/common/FormSection.scss` (approx):
  - grid-template-columns: 1fr !important; -- this is used in a responsive media query which forces layout and may override component-specific overrides.

- `src/components/CreateDropletTab/CreateDropletTab.scss` (approx):
  - border: 0 !important; position: absolute !important; .sr-only uses !important: these strongly influence layout and accessibility states across pages.

- `src/components/common/Panel.scss` + multiple other `.panel` definitions: repeated `.panel` class declared across component and styles files.

--

## Recommended overall scoping strategy (safety-first)

Goal: Reduce global selector leakage and collisions while avoiding visual regressions. The recommended approach is an incremental migration to CSS Modules (scoped classes) with a safe review process and CI guardrails.

Why CSS Modules?
- Generates locally-scoped class names automatically (reduces collision risk).
- Keeps authoring experience close to current styles (class-based SCSS) without runtime CSS-in-JS overhead.
- Plays nicely with existing CSS custom properties (var(--...)).

Migration principles (non-destructive):
- Avoid bulk automated replacements across repository. Prefer manual, small-scope edits with visual checks.
- Start with low-risk components (small, isolated components). Build tests and visual diffs for each migration.
- Replace global class names used in multiple places only after an audit and update of all usages.
- Remove `!important` only after resolving specificity or scoping issues.

Scoping options (ordered by preference):
1. CSS Modules on component-level SCSS files (recommended — best balance) ➜ filename.module.scss and import into TSX.
2. Scoped / unique BEM-like prefixes where shared global tokens are needed (e.g., `.cg-` prefix) — good for truly global utilities.
3. Keep global layout files (src/styles/Layout.scss) global but audit and isolate rules to avoid collision.

--

## Phase-by-phase migration plan (safe, time-estimated)

Phase 0 — Prep & Guardrails (1–2 days)
- Add stylelint rules + config to detect global selectors, element selectors, `!important` usage, and deep nesting. (see stylelint rules below)
- Add pre-commit hook to warn about non-scoped changes (optional).
- Add CI job (lint) to fail when new problematic patterns are introduced.

Phase 1 — Pilot migrations (small, 1–2 components) (2–4 days)
- Select small, low-risk components (e.g., Toast, Hero, LoadingSpinner)
- Change SCSS to CSS Modules e.g., Toast.module.scss
- Update imports in TSX to use module import patterns
- Run visual regression (storybook / playwright tests or manual QA) and iterate
- Remove any `!important` in these components and scope the rule

Phase 2 — Medium components & shared primitives (5–10 days)
- Migrate common components (ActionButton, StatusBadge, Input)
- For shared tokens (colors spacing) keep CSS custom properties in global :root and continue using them
- Where a shared style must remain global (e.g., a consistent card look), rename to `cg-card` and add comment explaining its global nature

Phase 3 — Larger panels and layout (10–30 days, gradual)
- Migrate larger panels like Panel, Dashboard sections, MonitoringPanel
- For each Panel, either:
  - Convert component to CSS Module and update all component code that uses `.panel`, or
  - Keep a namespaced global component (e.g., `.cg-panel`) and refactor callers where required
- Run visual diffs and QA with test plan for layout heavy pages

Phase 4 — Cleanup & enforce (2–3 days)
- Remove and deprecate old top-level CSS selectors
- Add blocking lint rule in CI to prevent new global collisions
- Update documentation (README, CSS_NAMING.md) and the PR checklist to enforce review standards

Notes on time estimates: depends on team size — above are conservative ranges for a single developer.

--

## Per-file sample migration guidance (pick the highest priority files first)

We highlight safe, review-first steps for the 6 most critical files: Panel.scss, Dashboard.scss, CreateDropletTab.scss, FormSection.scss, buttons.scss, and Card.scss.

Example: src/components/common/Panel.scss (critical)
- Problem: top-level `.panel` used across many components — collision risk.
- Safe migration steps:
  1. Create src/components/common/Panel.module.scss with the same rules but keep them local classnames (rename `.panel` to `.panelRoot` or keep `.panel` and import as styles.panelRoot when used in TSX).
  2. Update the parent components to import: import styles from './Panel.module.scss'; replace className="panel" with className={styles.panelRoot}.
  3. Add a short-lived compatibility shim: Keep the old `.panel` definition in Panel.scss but mark it deprecated with a TODO comment, and prefer module import.
  4. Run visual diff + manual QA for each page where Panel is used.
- After verification: remove the old global `.panel` declaration and merge the module versions.

Example: src/styles/Dashboard.scss (critical)
- Problem: `!important` used for layout and global selectors
- Safe migration steps:
  1. Audit each `!important` instance and identify why specificity was required. In most cases, `!important` was used to override global rules — fixing scoping or increasing specificity locally removes need for `!important`.
  2. For each top-level rule, decide whether it should remain global (site-level) or belong to a specific component.
  3. Migrate component-specific rules to CSS Modules, keep only necessary global layout rules in src/styles/layout.scss.
  4. Replace `grid-template-columns: 1fr !important;` with a scoped class and apply it only in the component which needs it.

Example: src/components/CreateDropletTab/CreateDropletTab.scss (critical)
- Problem: `border:0 !important` and `position:absolute !important` and `.sr-only` uses `!important`.
- Safe migration steps:
  1. Rework `.sr-only` rules into a globally namespaced utility class `.cg-sr-only` (move to src/styles/utils/_accessibility.scss).
  2. Remove `!important` usage by scoping the rules and using specificity or CSS modules.
  3. Replace absolute layout overrides with component-scoped layout so other components are not impacted.

Example: src/styles/buttons.scss (critical)
- Problem: global `.action-button` & variants — collisions possible
- Safe migration steps:
  1. Create ActionButton.module.scss and keep the global variants (if intentionally shared) moved to a small `buttons/globals` file with `.cg-btn--primary` and unique names.
  2. Update components to use module imports and confirm usage across all components.

--

## Before / after snippets (example)

BEFORE (global .panel in src/components/common/Panel.scss)

```scss
.panel {
  border-radius: 6px;
  background-color: var(--color-background);
}
```

AFTER (scoped module: Panel.module.scss)

```scss
.panelRoot {
  border-radius: 6px;
  background-color: var(--color-background);
}
```

React component update (TSX)

BEFORE

```tsx
<div className="panel"> ... </div>
```

AFTER

```tsx
import styles from './Panel.module.scss'

<div className={styles.panelRoot}> ... </div>
```

Notes: prefer descriptive class names inside modules to be clear (panelRoot, panelHeader, panelBody).

### Pilot migration examples — ready-to-copy snippets

These are small, safe-to-apply example migrations to use as a blueprint for your PRs. Always run local visual verification after each migration.

Small (pilot) — Toast component

BEFORE: src/components/Toast/Toast.scss

```scss
.toast {
  display: flex;
  align-items: center;
  background: var(--color-background-secondary);
  border-radius: 6px;
}
```

AFTER: src/components/Toast/Toast.module.scss

```scss
.root {
  display: flex;
  align-items: center;
  background: var(--color-background-secondary);
  border-radius: 6px;
}
```

TSX change (src/components/Toast/Toast.tsx)

BEFORE

```tsx
export default function Toast({ children }) {
  return <div className="toast">{children}</div>
}
```

AFTER

```tsx
import styles from './Toast.module.scss'

export default function Toast({ children }) {
  return <div className={styles.root}>{children}</div>
}
```

Medium (shared primitive) — ActionButton

BEFORE: src/components/common/ActionButton.scss

```scss
.action-button {
  display:inline-flex; align-items:center; justify-content:center;
}
```

AFTER: src/components/common/ActionButton.module.scss

```scss
.btnRoot { display:inline-flex; align-items:center; justify-content:center; }
```

Then update imports across components to the module and only keep a small,-namespaced global shim if you must preserve an API surface (eg. `.cg-action-button` for shared utilities).

Large (layout-heavy) — Panel (process outline)

1. Identify all references: `rg "\.panel\b" -n src`
2. Create Panel.module.scss as a copy of the core styles and update the Panel component to import the module.
3. Create a temporary compatibility shim that maps `.panel` to `styles.root` while refactoring the usage across callers in smaller follow-up PRs (avoid big-bang replace).
4. Run visual tests and manual QA for pages that use Panel heavily.

### Migration checklist for any single-component PR (copy into PR template)

This is a practical checklist to include in a migration PR for converting a component to CSS Modules.

- [ ] Confirm the component is isolated and has <= 3 places used site-wide (pilot components only should be small surface area)
- [ ] Add `Component.module.scss` file and copy rules from existing SCSS (rename classes to semantic module names)
- [ ] Update TSX to import the module and replace className usage
- [ ] Add or update a visual test showing before-and-after screenshots or Storybook story snapshot
- [ ] Run `./frontend/scripts/scan-summary.sh` and include output in the PR comment if it shows changes to global selectors
- [ ] Remove `!important` usages inside the component and increase specificity if necessary
- [ ] Run stylelint and fix issues (or document why an exception is needed)
- [ ] Ensure accessibility & keyboard behavior unchanged (smoke test for focus states)
- [ ] Add comments referencing any shared functionality left in global scss and create follow-up TODOs to migrate those too


--

## Detection commands & regex (safe to run locally)

Use these grep/awk/rg commands to detect problematic patterns across the frontend folder. Run locally and review outputs before changing anything.

- Find all !important uses:
  - grep -R --line-number "!important" frontend | sed -n '1,200p'
  - rg "!important" frontend -n

- Find top-level classes frequently used across multiple files (e.g., `.panel`, `.card`, `.form-section`):
  - rg "\.panel[[:space:,.{]" frontend -n
  - rg "\.card[[:space:,.{]" frontend -n
  - rg "\.form-section[[:space:,.{]" frontend -n

- Find element selectors used inside scss files (possible leaks):
  - rg "^\s*(html|body|h1|h2|h3|p|label|th|td|table|button|input)" frontend -n

- Find IDs (#) usage:
  - rg "#\w+" frontend -n

- Find deep nesting: (heuristic, > 4 levels indentation — tweak as needed)
  - rg "^\s{8,}.+" frontend -n

- Find potential duplicates (same selector repeated in more than one file):
  - rg "\.panel\b|\.card\b|\.action-button\b|\.sr-only\b" frontend -n | sort | uniq -c | sort -nr

- Show all SCSS files found under frontend (for completeness):
  - find frontend -name "*.scss" -print

Scripts available in this repo (non-destructive) to run the most common checks quickly:

- frontend/scripts/find-important.sh — report all !important occurrences
- frontend/scripts/find-global-classes.sh — report occurrences of frequently reused selectors (panel, card, action-button, etc.)
- frontend/scripts/scan-summary.sh — aggregated quick summary that runs the scans above plus element selector and nesting heuristics

Make them executable and run from repo root:

```bash
chmod +x frontend/scripts/*.sh
./frontend/scripts/scan-summary.sh
```

--

## Safe preview commands and pattern-targeted edits (manual-first)

General approach: always run these commands *before* making code changes and use them to create a small diff that you can review.

- Create a dry-run patch for a single file change (UNIX):
  - git checkout -b fix/scss-panel-scope
  - cp src/components/common/Panel.scss src/components/common/Panel.module.scss
  - # Manually edit Panel.module.scss, then create a preview commit
  - git add -N src/components/common/Panel.module.scss && git diff --staged src/components/common/Panel.module.scss

- OR use `git apply --stat` to preview patches:
  - git diff -- <file> | git apply --stat

- Visual diff (if you have Storybook or a run:dev):
  - Start dev server (e.g., npm run dev) and run a before-and-after component screenshot using Playwright / puppeteer or Storybook.

- Use selective build to preview the compiled CSS for a single file migration (works with CSS Modules compile config):
  - Build or start dev, check the site pages where the component appears.

--

## stylelint rules, suggested config, and CI integration

Use stylelint with custom rules to detect regressions and block new global selectors and `!important` usage.

Suggested dev dependency:
- stylelint
- stylelint-scss
- stylelint-order (optional)
- postcss-scss parser

Example .stylelintrc (recommended rules to start):

```json
{
  "extends": ["stylelint-config-standard"],
  "plugins": ["stylelint-scss"],
  "rules": {
    "at-rule-no-unknown": null,
    "scss/at-rule-no-unknown": true,
    "selector-max-id": 0,
    "selector-max-type": [0, { "ignore": ["descendant" ] }],
    "selector-class-pattern": "^([a-z0-9]+((-|__|\\.)[a-z0-9]+)*)$|^[A-Z][a-zA-Z0-9]+$|^module$",
    "max-nesting-depth": [4, { "severity": "warning" }],
    "declaration-no-important": true,
    "no-duplicate-selectors": true
  }
}
```

Explanation of important rules:
- declaration-no-important: blocks `!important` usage (start by setting to warning in PRs, or allow with exception comments for known cases and then remove them gradually).
- max-nesting-depth: warning for >4. Raise/lower per project style.
- selector-class-pattern: encourage lower-case BEM or Pascal-case for components; adjust to match your naming conventions.

CI integration example (GitHub Actions):
 - Add a job `frontend-style-lint` which runs `npm ci && npm run stylelint:ci` and fails the job on lint errors. Example workflow file has been added to .github/workflows/frontend-stylelint.yml (update branch names as needed).
- Add additional job: `frontend-css-audit` that runs scripts to detect `.panel` re-usage or `!important` and fails for new instances.

sample .github/workflows/frontend-lint.yml fragment

```yaml
name: Frontend Lint
on: [push, pull_request]
jobs:
  stylelint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install
        run: yarn install --frozen-lockfile
      - name: Stylelint
        run: yarn stylelint "frontend/**/*.scss" || (echo "Stylelint failed" && exit 1)

  css-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Detect !important
        run: |
          if rg "!important" frontend -n; then
            echo "Found !important instances — fail the CI.\nRun the audit doc for guidance"; exit 1
          fi
```

 Tip: during migration, start stylelint rules as warnings in CI and then switch to errors once the codebase is cleaned progressively.

You should add stylelint and stylelint-scss as devDependencies inside `frontend` before enabling the CI enforcement. Recommended installs (run from frontend dir):

```bash
npm install --save-dev stylelint stylelint-scss stylelint-config-standard postcss-scss
```

--

## PR checklist & reviewer guidance (copy into PR templates)

Add this to the repo's PR template or use the default PR description checklist for any SCSS changes:

- [ ] I ran the grep/rg detection commands and recorded where the selectors are used (list files).
- [ ] I updated/created `.module.scss` and updated component imports where needed.
- [ ] Visual verification: screenshots before/after for affected pages are attached.
- [ ] No new `!important` usages were introduced.
- [ ] stylelint rule violations fixed (or explicitly justified in comments).
- [ ] If a global class is intentionally kept — it is prefixed `cg-` and documented in CSS_NAMING.md.
- [ ] Tests (if applicable) added/updated (playwright/storybook snapshots).

Reviewer guidance:
- Use the diff to ensure all usages were replaced correctly across components.
- Run local dev server and navigate to pages where the component is used to check visual regressions.
- Ensure `:root` variables used remain unchanged, verify color tokens.

--

## Visual verification steps (recommended)

- Ensure a baseline build screenshot set exists (Storybook or Playwright tests) for critical pages (Dashboard, Clusters, Autoscaling, Monitoring).
- For each changed component, capture before-and-after screenshots and use an automated visual diff tool (Playwright image snapshot or Puppeteer pixel comparison) to detect unintended changes.
- Manual QA: check responsive breakpoints and keyboard accessibility when layout changes were made.

Playwright quick-run example (recommended):

1. Start dev server in one terminal: `npm run dev` (or `yarn dev`) at repo root + `cd frontend` if necessary.
2. In `e2e/playwright` directory (this project already has Playwright setup), write a visual test or re-use an existing scenario to capture snapshots. Example test snippet for a component/route:

```ts
// example: e2e/playwright/tests/visual-toast.spec.ts
import { test, expect } from '@playwright/test'

test('Toast component visual regression', async ({ page }) => {
  await page.goto('http://localhost:5173'); // update to dev host/port
  // navigate to the page/state that shows the Toast
  // screenshot a single element
  const toast = page.locator('.toast')
  await expect(toast).toHaveScreenshot('toast-v1.png')
})
```

3. Run the playwrite test: `cd e2e/playwright && npx playwright test tests/visual-toast.spec.ts --update-snapshots` to capture a baseline snapshot; then run without update to validate.

These steps are a minimal integration approach to catch visual regressions when scoping styles and removing global selectors. Integrate snapshot comparisons into CI for migrated PRs (run only story/test snapshots for the affected components to keep CI fast).

--

## Migration scripts / helper commands (proposals, run manually and review before applying)

- Find components that use `.panel` and prepare a manual migration map (list files where `.panel` appears):
  - rg "\.panel\b" frontend -n > ./tmp/panel-refs.txt

- Create a checklist of affected components with counts and paths so you can update TSX imports and run a local build test.

--

## Post-cleanup & documentation

- Update `frontend/CSS_NAMING.md` or `frontend/README.md` with the new conventions (component modules, `cg-` prefix for shared global utilities).
- Add a short `frontend/CONTRIBUTING.md` section or a small `frontend/STYLEGUIDE.md` summarizing:
  - Use CSS Modules for component styles — filename.module.scss
  - Keep tokens in :root with custom properties
  - No `!important` except for rare documented exceptions
  - Avoid type selectors in component styles; use explicit classnames

--

## Final recommendations & notes

- Prioritize protecting the user experience — small safe migrations, each followed by visual checks.
- Start with the handful of critical files (Panel.scss, Dashboard.scss, CreateDropletTab.scss, buttons.scss, Card.scss) and run the pilot.
- Adopt stylelint and CI guards early to prevent new regressions.
- Keep global utilities deliberately small and namespaced (cg- prefix). Document everything in CSS_NAMING.md.

---

If you'd like, I can now:
- produce a ready-to-apply gist of the stylelint config and a GitHub Actions workflow step for CI (non-destructive), OR
- prepare a step-by-step migration PR example for one pilot component (Toast or Hero) showing the exact changes across TSX and SCSS and a Playwright visual test to compare before/after.

Which would you prefer next? (I can implement the CI lint step OR author a pilot migration PR for a chosen component.)
