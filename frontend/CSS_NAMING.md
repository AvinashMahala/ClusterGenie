# CSS Namespacing & Collision Policy (ClusterGenie frontend)

This project introduced a lightweight namespacing strategy for shared UI primitives to reduce global CSS collisions and make style ownership explicit.

Why
- Historical/global selectors (e.g. `.card`, body centering rules) led to unpredictable overrides when component-specific styles were compiled and loaded in different orders.
- Goal: make shared primitives explicit and safe to extend while keeping backward-compatible aliases to reduce immediate churn.

Key changes applied (safe, backward-compatible)
- Added `cg-` prefixed aliases for shared component classes: `.cg-panel`, `.cg-card`, `.cg-action-button`, `.cg-alert`, `.cg-loading-spinner`, `.cg-select-wrapper`.
- Components render both class names (e.g. `class="panel cg-panel"`) — existing styles continue to work while new namespaced styles are available.
- Removed accidental global `.card` in `App.css` and made body layout flows normal in `index.css` (no global `display:flex` centering).

Recommended rules for contributors
1. Scoped selectors only: prefer nesting a component root (e.g. `.monitoring-panel { .panel { ... } }`) instead of redefining global `.panel`.
2. When styling shared primitives, use the `cg-` prefix in new styles (e.g. `.cg-card`), keep `card` unchanged until you can migrate component usages.
3. Avoid adding top-level selectors for shared names in application-level CSS; prefer `.app-` prefixed helper classes.
4. Consider using CSS Modules or BEM for new components to eliminate global collisions.

How to migrate a component
1. Update the component markup to include prefixed classnames (we already added these to common primitives).
2. Replace component-level uses of raw `.panel`/`.card` with our scoped wrapper classes or continue nested scoping under your component class.

Tooling
- A simple check script is available at `frontend/scripts/check-css-namespaces.sh` to find potential top-level collisions. Run it as part of CI for added safety.
