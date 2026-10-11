# Deferred work

- **Portal order status.** The Portal's service request stays "submitted", and no one tells the Portal that the order is complete. The Portal shows the service as ✓ HEALTHY, which is enough for the story. Adding an "order completed" handoff would mean a new artifact.
- **No unit test for `describe`'s network branch** (link and path in each view).
- **Plan 4: Inspector and earlier versions.** Earlier versions are visually hidden spans inside one card, shown as stacked edges. Decide how selection, the ring and lineage links handle them, given that a button can't be nested in a button.
- **Plan 4: Orchestrator's `does` text.** "Relays requests to Intent." conflicts with its doesNot. Reword to "Turns service requests into its own intent requests."
- **Plan 4: Keyboard gate.** The window keydown handler must ignore story keys while About is open.
- **Plan 5: Path-naming regex** (`tests/unit/story.test.ts`). It misses "path: B" and "via KOL01". Widen it first in the content pass.
- **Plan 5: R2's Simple caption** omits Observability answering Orchestrator with path B health. This is a parity item.
- **Plan 5: ds1 probe line.** Write "CPH01 ↔ AAR01 (CPH01 sender, AAR01 stateful reflector)".
- **Plan 5: beatTable P8 order assertion.** Use `toMatch(/read back applied state.*read back done/)`.
- **Plan 5: Live region.** The caption is announced, but the chapter, counter and title are not.
- **Plan 5: Storage-blocking e2e test** should first assert that storage is actually blocked.
- **Plan 5: Chapter buttons.** Add `aria-current` to the current chapter.
- **Plan 5: Copy trimmed to fit (plan 2), for review.** Shortened to fit fixed card slots: ev-viol (meaning, Technical), evid (meaning, Technical), pathB (meaning, Technical), ev-repair (Technical), norm-deg (Technical), enr-base/enr-deg/enr-after (Technical, and enr-deg's meaning), obs1 (Technical). The test-required substrings are kept.
- **Plan 4: Line labels are focusable buttons with no action yet.** The inspector gives them their handoff and signal views.
