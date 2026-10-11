# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** network engineers, network architects and senior technical leadership. They know networking (L3VPN, routing, optics, redundancy) and want a clear mental model of how automation systems divide the work.
- **Secondary:** software, platform and automation engineers.

Mostly met as a public link explored alone at a desk; sometimes presented live in talks or meetings (projector or screen share), with a presenter stepping through the story.

## Product Purpose

**How Network Automation Works** is an interactive explainer of network automation as separate **responsibilities** connected by **typed handoffs**, based on the Network Automation Forum (NAF) framework. One continuous story follows an ACME L3VPN service through **Provision → Detect → Remediate**.

Success: after a walk-through, people can explain the roles and the handoffs between them, and use the picture to discuss their own automation design with colleagues. Persuading anyone to adopt NAF is not the goal.

## Positioning

Automation is easier to reason about as roles and handoffs than as a list of tools, and "the interface is UP" is not the same as "the service is healthy". The explainer shows one causal story on one persistent canvas, with a Simple/Technical switch that changes depth but never the story. It is **an example** of how good network automation can look with NAF as the reference, not a prescription for how it should look.

## Operating Context

- Desktop browser, about 1440×900 target; a fixed stage scaled to fit the window.
- Keyboard-driven story (→ / ←, Next / Back), chapter and step jumps, Replay, and an inspector for any card, line label or responsibility.
- An About window opens on every load and from an About button.
- Live presentation must work from the same page with no separate mode.

## Capabilities and Constraints

- Existing stack: Svelte 5 + Vite + TypeScript, Vitest and Playwright. No backend, analytics, mobile, touch or scenario authoring.
- Decided requirements live in `docs/brief/` (02, 03, 06, 07); approved specs in `docs/specs/`; decisions in `docs/adr/`. `CLAUDE.md` holds the NAF semantic invariants, which are hard rules.
- Terminology is fixed: Presentation, Intent, Orchestrator, Executor, Collector, Observability are **responsibilities** (roles, not products); **The Network** is infrastructure, not a responsibility. Coordination **signals** are not **artifacts**.
- Status (HEALTHY, DEGRADED, VIOLATED, CLEARED) is always icon + word, never colour alone, and never reuses a provenance colour.
- Hard-coded, scenario-specific values and geometry are acceptable.

## Brand Commitments

- Independent personal project, **not** an official or endorsed NAF product. It must not imply NAF endorsement.
- Uses the NAF block colours as provenance colours by reference: Presentation `#f5c518`, Observability `#00e676`, Orchestrator `#00d4ff`, Intent `#ff6d2e`, Collector `#F43F5E`, Executor `#6366F1`, Infrastructure `#64748b` (https://reference.networkautomation.forum/Framework/brand-guidelines/).
- Voice: calm, precise, technical; plain words for Simple view, identifiers and values for Technical.
- Credits (decided, `docs/brief/06-about-and-credits.md`): NAF Automation Framework, and Thomas Kjær Aabo's *How the Internet Works* as inspiration. No code, text or assets from it are used.

## Evidence on Hand

- The ACME L3VPN scenario (`docs/brief/03-story-and-scenario.md`) is illustrative. Its values, payloads and topology are examples, not measurements from a real network.
- No testimonials, users, adoption figures or NAF endorsement exist; do not invent them.

## Product Principles

1. **Semantics first.** The NAF invariants outrank any visual or narrative convenience; if they conflict, stop and raise it.
2. **One causal story.** Small steps on one persistent canvas; Simple and Technical tell the same story at different depths.
3. **Device state is not service state**, in both directions; the experience must make that visible.
4. **An example, not a prescription.** Closed-loop remediation is one pattern among others.
5. **Inspect anything in place.** Every artifact and responsibility can explain what it is, who produced it, who uses it.

## Accessibility & Inclusion

Keyboard-driven story and inspector, visible focus, focus never lost during navigation, reduced-motion parity (same end state without animation), WCAG AA text contrast, and status never conveyed by colour alone.
