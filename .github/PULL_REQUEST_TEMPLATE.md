## SCSS / CSS migration checklist

If this PR touches SCSS or component styles, please make sure to complete the items below.

- [ ] Ran the repo-wide scans (`./frontend/scripts/scan-summary.sh`) and included results if they relate to this PR
- [ ] Converted styles to CSS Modules where applicable and updated imports
- [ ] No new `!important` usages were introduced; if present, add justification in PR body
- [ ] Visual verification added: before/after screenshots or Storybook snapshot(s)
- [ ] Stylelint issues resolved or explicitly approved for exception
- [ ] Accessibility: keyboard/focus checks smoke-tested
- [ ] If preserving a global class, it is namespaced (e.g., `cg-` prefix) and documented

Notes:
- For visual testing, we recommend using Playwright snapshots or Storybook stories. See frontend/CSS_AUDIT_AND_FIXPLAN.md for example commands and test suggestions.
