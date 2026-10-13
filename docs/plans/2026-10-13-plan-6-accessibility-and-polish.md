# Plan 6: accessibility, polish, tests and copy review

**Source:** the "Plan 6:" items in `docs/deferred-work.md`, triaged with the owner on 2026-10-13. **Branch:** `plan-6`.

## Built

- **A. Accessibility.** One polite live region announces "Chapter, step n of 38: Title. Caption" (and the completion line on the last beat); the visible caption is no longer live. The current chapter button has `aria-current="true"`. Card and surface selection rings are drawn just inside the element (offset −4px), because bottom-row cards sit flush with their region's clipped edge. The open inspector re-sides itself after every navigation, so a target that appears in a later beat gets the panel opposite it.
- **C. Polish.** The Technical probe line fades in with the R7 path change. A new card keeps its provenance tint on hover (contrast-tested). The About eyebrow is gone.
- **D. Tests.** Wider path-naming regex; P8 order as one regex; storage-block tests assert the block is real; every version appears exactly once; the Enter focus test re-asserts selection; "Answered by" is checked for every signal, including "Nothing: it answers an earlier request."; `describe`'s network branch.

## Rulings

- The stacked earlier-version shadow stays: it is the "v2 stacked over v1" look brief 03 asks for, not decoration.
- P14's short work line stays: the 8px column gap sets its length; a minimum length would overlap the cards.

## Copy review (E), applied

The owner decided all 35 strings on the review page (2026-10-13). Applied: ds1 probe line names sender and reflector; the desired-state `uses` names the version; the how-to line and hint include surfaces; the API surface says it could carry the same service request as the Portal; evidence says "likely optical degradation"; path B says "ACME itself"; normalized degraded keeps the probe direction; raw signals get "dBm" back (degraded drops the interface name to fit). Kept as is: R2 Simple, the path-health `uses`, the other surface texts, the completion line, the P1 caption, the work labels and the other card cuts. The violation event's Technical restore didn't fit; the owner kept the two lines.

## Still to do

- **Repair request rework.** The owner wants the link repair ticket raised from the Detect chapter's link problem, not tied to ACME. Design to be agreed before building.
- One review of the whole branch, then merge and push.
