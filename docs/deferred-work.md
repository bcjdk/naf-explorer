# Deferred work

- **Portal order status.** The Portal's service request stays "submitted", and no one tells the Portal that the order is complete. The Portal shows the service as ✓ HEALTHY, which is enough for the story. Adding an "order completed" handoff would mean a new artifact.
- **No unit test for `describe`'s network branch** (link and path in each view).
- **Plan 6: Path-naming regex** (`tests/unit/story.test.ts`). It misses "path: B" and "via KOL01". Widen it first in the content pass.
- **Plan 6: R2's Simple caption** omits Observability answering Orchestrator with path B health. This is a parity item.
- **Plan 6: ds1 probe line.** Write "CPH01 ↔ AAR01 (CPH01 sender, AAR01 stateful reflector)".
- **Plan 6: beatTable P8 order assertion.** Use `toMatch(/read back applied state.*read back done/)`.
- **Plan 6: Live region.** The caption is announced, but the chapter, counter and title are not.
- **Plan 6: Storage-blocking e2e test** should first assert that storage is actually blocked.
- **Plan 6: Chapter buttons.** Add `aria-current` to the current chapter.
- **Plan 6: Copy trimmed to fit (plan 2), for review.** Shortened to fit fixed card slots: ev-viol (meaning, Technical), evid (meaning, Technical), pathB (meaning, Technical), ev-repair (Technical), norm-deg (Technical), enr-base/enr-deg/enr-after (Technical, and enr-deg's meaning), obs1 (Technical). The test-required substrings are kept.
- **Plan 6: Probe line in R7.** In Technical view, the dotted probe line switches from ODE01 to KOL01 at the start of R7 instead of fading in with the path change (`.probe` in `Network.svelte` is not in the `path` motion target).
- **Plan 6: Impeccable flags on the incumbent look (for a design decision, not a defect).** Its detector and craft floor flag the 3px provenance edge on cards and the About blockquote (`border-left: 3px`), the 3px top edge on the rounded About dialog, the hard offset `box-shadow` of stacked earlier versions (`.card.stack-1/-2`), and the "About" eyebrow above the About title. All are deliberate today (provenance edge and version stacks are spec §5); decide whether to keep or restyle them.
- **Plan 6: Two loose `uses` sentences.** pathHealth: "policy moves the service" should read "decides to move". desiredState: "configuration that the apply request names" should read "the desired-state version that the apply request names".
- **Plan 6: Selection ring at region bottoms.** `.region { overflow: hidden }` may clip the ring on bottom-row cards, and the full-width Presentation and Network rings are partly covered by design. Check once plan 5 has re-tuned the geometry.
- **Plan 6: Inspector side after a target appears.** The panel side isn't recomputed when a target that wasn't drawn later appears in a beat.
- **Plan 6: Test gaps from plan 4.** The Task 2 focus test's Enter is a no-op and doesn't re-assert `.selected`. The responsibility/answeredBy tests mirror the implementation's predicate, and there's no test for the "Nothing: it answers…" text.
