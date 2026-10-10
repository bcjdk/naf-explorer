# Deferred work

- **Portal order status.** The Portal's service request stays "submitted", and no one tells the Portal that the order is complete. The Portal shows the service as ✓ HEALTHY, which is enough for the story. Adding an "order completed" handoff would mean a new artifact.
- **Observability headroom.** At R14 in Technical view the Observability region fits with only about 0–1px to spare under the skeleton CSS. Plan 2's geometry should give it real headroom, so a different font stack can't clip it.
- **Step tick contrast and size.** Unselected step ticks are about 1.7:1 against the background (below WCAG 1.4.11's 3:1 for non-text contrast) and only 8×14px. Plan 2 should restyle them.
