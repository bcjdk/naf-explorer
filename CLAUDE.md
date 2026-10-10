# Working in this repo with Claude Code

## What this project is

**How Network Automation Works** is an interactive, desktop-first explainer of network automation. It is built around the Network Automation Forum (NAF) framework: separate **responsibilities** connected by **typed handoffs**.

One continuous story follows an **ACME L3VPN** service through three chapters:

- **Provision:** service intent becomes a working, verified service.
- **Detect:** network signals become service understanding.
- **Remediate:** the network is changed to restore the service, while the faulty link still needs repair.

Audience:

- **Primary:** network engineers, network architects and senior technical leadership who know networking (L3VPN, routing, optics, redundancy) and want a clear mental model of how automation systems divide the work.
- **Secondary:** software, platform and automation engineers.

The demo shows **an example** of how good network automation *can* look with NAF as the reference. It is **not** a prescription for how network automation *should* look.

## Sources of truth

- `docs/brief/` holds the rebuild brief. `02-domain-and-semantics.md`, `03-story-and-scenario.md`, `06-about-and-credits.md` and `07-acceptance-checklist.md` are **decided requirements**. `04-experience-and-visual-direction.md` and `05-lessons-learned.md` are guidance.
- Approved design specs and plans belong under `docs/` (for example `docs/specs/`, `docs/plans/`). Record significant decisions as ADRs in `docs/adr/`.
- If implementation would conflict with a decided requirement or an approved spec, **stop and raise it**. Do not silently reinterpret the requirement.

## NAF semantic invariants (hard rules)

Responsibilities: **Presentation, Intent, Orchestrator, Executor, Collector, Observability**. **The Network** (infrastructure) is separate and is not an automation responsibility. These are roles, not products.

- **Orchestrator** sequences workflows through coordination **signals** (start, ready, onboard, onboarded, apply, applied, read back, read back done, check drift, in sync, query) and makes workflow decisions. Every job it starts is answered back to it before it sends the next one (ADR 0001). It never configures the network, and never owns or persists intended state (service intent, derived network intent, desired state). It passes on only its own artifacts (for example an intent request or a remediation decision).
- **Intent** is the source of truth for intended state: service intent, derived network intent and desired state. Intent also performs the **drift check**: does the observed state match the desired state?
- **Content travels directly** from the responsibility that produces it to the one that uses it, never via Orchestrator. In this scenario Executor takes desired state from Intent, and Observability takes the SLO definition from Intent. The Executor input pattern is one common pattern, not a NAF requirement.
- **Executor** renders and applies configuration changes. It does not decide what the network should be, and it does not verify the outcome: a successful commit is not verification.
- **Collector** gathers and normalizes live network state, and **structurally** enriches it (interface → link → path → service ID) from a **locally cached copy of intent**. After a change it reads back the applied state for Intent's drift check. Collector never judges service impact.
- **Observability** adds **operational** meaning. It turns SLO definitions into SLO rules, computes SLIs, correlates observations, evaluates SLIs against SLOs, and raises and clears service-impact events. Correlation is a strong clue, not proof of root cause.
- **Presentation** is where people and other systems interact with automation (portal, fault management, ITSM, performance dashboards, APIs). It displays what it receives. It never decides or acts on its own.
- **Device state is not service state, in both directions.** UP does not mean healthy, and a degraded link does not mean a degraded service.
- **Closed-loop remediation is one pattern**, not the definition of network automation. A deployment could add an operator approval gate.

If implementation would violate one of these rules, stop rather than improvise around it.

## Product and experience principles

- **One persistent canvas** whose responsibilities stay in recognisable places while the story progresses inside them. It must not feel like slides, a dashboard or a wizard.
- **Small causal steps.** In each step, at most one new artifact per responsibility. The motion order is: input becomes relevant → work happens → artifact appears → handoff → the receiver gains the result.
- **Simple and Technical views tell the same causal story.** Technical may add identifiers, values, fields, protocol examples and scope notes. It must never add a causal step that Simple lacks.
- **Inspect anything in place.** The inspector shows what an artifact is, who produced it, who uses it, and what a responsibility does and does not do.
- **Visual grammar:**
  - colour shows **provenance** (who produced it);
  - **status** (HEALTHY, DEGRADED, VIOLATED, CLEARED) is always icon + word, never colour alone, and never reuses a provenance colour;
  - selection and activity are separate visual systems.
- **Calm, technical look.** No neon, NOC-wall, glassmorphism or decorative motion.
- **Accessibility essentials:** keyboard-driven story and inspector, visible focus, focus never lost during navigation, reduced-motion parity (same end state without animation), and WCAG AA contrast for text.

## Delivery mode

- **Demo-first.** Reach the complete Provision → Detect → Remediate story quickly.
- **Desktop only** (about 1440×900 target). No mobile, touch, backend, analytics, scenario authoring or generalised frameworks.
- **Hard-coded, scenario-specific values and geometry are fine.** Avoid speculative abstractions.
- **Block progress only for:** semantic errors, a broken causal story, architecture that will compound, broken primary interaction, accessibility-critical defects, or failing tests that reveal real problems.
- **Record cosmetic issues** in `docs/deferred-work.md` instead of stopping for them.

## Testing expectations

- Encode the semantic invariants and the story rules as **automated tests over the scenario data** (see `07-acceptance-checklist.md`). Never weaken them to make tests pass.
- Add browser tests for the walk-through, navigation during animation, inspector and focus behaviour, reduced motion, layout (no clipped text, no overlapping cards), and an automated accessibility scan.
- Before committing, run the project's formatting, type-checking, unit, browser and build checks.

## Ground rules

- Prefer editing existing files over creating new ones.
- Add comments only for non-obvious *why*.
- Validate at boundaries; don't add handling for cases that can't happen.
- Never commit secrets.
- Don't add CI/CD or major dependencies without an ADR.
- Commit or push only when asked.

## Workflow

For substantial work, use the Superpowers workflow:

1. brainstorm;
2. written spec;
3. user review;
4. implementation plan;
5. execute in small, reviewed steps;
6. review semantics at meaningful checkpoints.

Do not start implementation while product or architecture decisions are unresolved.
