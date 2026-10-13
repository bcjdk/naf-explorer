# Plan 6: accessibility, polish, tests and copy review

**Source:** the "Plan 6:" items in `docs/deferred-work.md`, triaged with the owner on 2026-10-13. **Branch:** `plan-6`.

## Built

- **A. Accessibility.** One polite live region announces "Chapter, step n of 38: Title. Caption" (and the completion line on the last beat); the visible caption is no longer live. The current chapter button has `aria-current="true"`. Card and surface selection rings are drawn just inside the element (offset −4px), because bottom-row cards sit flush with their region's clipped edge. The open inspector re-sides itself after every navigation, so a target that appears in a later beat gets the panel opposite it.
- **C. Polish.** The Technical probe line fades in with the R7 path change. A new card keeps its provenance tint on hover (contrast-tested). The About eyebrow is gone.
- **D. Tests.** Wider path-naming regex; P8 order as one regex; storage-block tests assert the block is real; every version appears exactly once; the Enter focus test re-asserts selection; "Answered by" is checked for every signal, including "Nothing: it answers an earlier request."; `describe`'s network branch.

## Rulings

- The stacked earlier-version shadow stays: it is the "v2 stacked over v1" look brief 03 asks for, not decoration.
- P14's short work line stays: the 8px column gap sets its length; a minimum length would overlap the cards.

## Still to do

- **E. Copy review.** The owner decides each string on the review page; Claude applies the choices, re-fits the cards, and updates `docs/deferred-work.md`. The plan 6 content fixes (R2 Simple parity, ds1 probe line, two `uses` sentences, surfaces in the how-to and hint) ride on the same page.
- One review of the whole branch, then merge and push.
