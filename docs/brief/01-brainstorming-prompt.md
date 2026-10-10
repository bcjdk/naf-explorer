# Kick-off prompt

Paste everything below the line into Claude Code in the new project. First copy `CLAUDE.md` to the project root and the numbered documents to `docs/brief/`.

---

/superpowers:brainstorming

Do not implement anything yet.

We are building **How Network Automation Works**: a desktop-first, interactive explainer of network automation based on the Network Automation Forum (NAF) framework. It follows one ACME L3VPN service through Provision → Detect → Remediate.

This is a **rebuild from scratch**. An earlier version existed and went through many review rounds. Its decisions have been captured in `docs/brief/`. Nothing from the earlier code is reused.

Read these first:

- `CLAUDE.md`: how to work here, and the NAF semantic invariants (hard rules).
- `docs/brief/02-domain-and-semantics.md`: **decided**. The responsibilities, who talks to whom, signals vs content.
- `docs/brief/03-story-and-scenario.md`: **decided**. The ACME scenario, the facts and values, the causal flow of each chapter, the artifacts, and the status and alarm lifecycle.
- `docs/brief/06-about-and-credits.md`: **decided**. The About window content and credits.
- `docs/brief/07-acceptance-checklist.md`: **decided**. The definition of done.
- `docs/brief/04-experience-and-visual-direction.md`: **guidance**. What worked before; open to redesign.
- `docs/brief/05-lessons-learned.md`: **guidance**. Pitfalls found last time; design them out from the start.

**Already decided (do not reopen; raise a conflict if you see one):**

- the domain semantics;
- the story's causal flow;
- the status and alarm lifecycle;
- the pacing rule (at most one new artifact per responsibility per step);
- Simple/Technical parity;
- the About content;
- desktop-only, demo-first scope;
- the acceptance criteria.

**Open, and for you to propose with trade-offs and a recommendation:**

1. **Tech stack and tooling.** It must support a fixed-size, scaled stage with HTML text and SVG lines, strict typing, unit tests over the scenario data, browser tests, and automated accessibility checks. No backend.
2. **Spatial layout and visual design.** Use the guidance as a starting point and keep the NAF arrangement unless you have a better reason.
3. **How the scenario data is modelled.** It must be one canonical source from which both views, the inspector and the semantic tests are derived.
4. **Motion approach.** It must follow the causal order, never block navigation, and reach the same end state with reduced motion.
5. **The step breakdown.** How the decided causal flow maps to individual beats under the pacing rule.

Process:

- Ask focused questions one at a time, only where the answer changes the design.
- Challenge contradictions and unnecessary complexity.
- Look for ways to reach a demonstrable end-to-end version quickly without weakening the semantics.
- When the design is coherent, summarise:
  - the user experience;
  - the spatial model;
  - the step breakdown;
  - the artifact types and handoffs;
  - Simple vs Technical behaviour;
  - the inspector;
  - motion and accessibility;
  - the stack;
  - what is deferred;
  - unresolved decisions.

Then stop for my approval before writing the specification.
