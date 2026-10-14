# Plan 6a: story fixes from the owner's Simple-view walk-through

**Source:** owner assessment round, 2026-10-13 (points 2-6; point 1 kept as is). **Branch:** `plan-6a-story-fixes`.

## Changes

1. **Service request inspector (P2).** Its "What it is" and Orchestrator's use focus on its job: start the right workflow. The service details reach Intent in Orchestrator's intent request.
2. **No internal references in shown text.** Drop "(ADR 0002)" from the apply request inspector and the P7 and R6 Technical captions; drop the insider word "own" where it describes Orchestrator's artifacts (Observability's "own SLO rule" stays: it contrasts with Intent's definition). A unit test fails if any shown scenario text contains "ADR", "spec §" or "plan N".
3. **D1 catches the eye.** The Network region is active (lifted panel and border) on the beat its link degrades, and the region lights up in motion like any active region. Reduced motion shows the same end state.
4. **R13 caption.** Simple: "Observability checks the new SLI against the same SLO rule as before. Nothing is lost, so ACME's service is healthy again. The rule didn't change; the network did." Technical: "Rule acme-loss (unchanged): SLI 0.00% < 0.1% → service state HEALTHY."
5. **Orchestrator asks ITSM for the repair (ADR 0004).** A new Orchestrator artifact, the **repair request** (lineage: remediation decision, HEALTHY service state), goes to ITSM in R15. Orchestrator then completes the remediation workflow there, not in R14. Observability no longer sends a repair-needed event. Brief 02, 03, 07, CLAUDE.md and spec §5 are amended to match.

## Rulings

- The repair request needs no answer: it goes to Presentation, which never acts, and the repair itself happens outside automation. ADR 0001's pairing covers jobs Orchestrator gives responsibilities.
- The Network's activity comes from the fault itself (a state flag), not from a work verb: The Network does no automation work.
- The beat count stays 38; artifact kinds become 21.

## Verification

`npm run verify` green, including the layout referee for the longer R15 caption and the workflow card's extra step.
