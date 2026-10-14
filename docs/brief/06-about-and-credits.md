# About window and credits (decided)

## Behaviour

- **One window, two ways to open it:** it opens automatically on **every load and refresh** (changed from first visit only by the user, 2026-10-11), and from an **About** button just right of the Simple/Technical switch.
- **Closing:** a **✕ in the top-right corner**, **Esc**, or a click outside. There is **no Start button**.
- **It is a modal dialog:**
  - focus moves to ✕ when it opens and returns to where it was when it closes;
  - the story does not move while it is open;
  - links open in a new tab.

## Content

Reworked with the owner on 2026-10-14: the window had grown into a hard-to-read wall of text. It now has **two views**. Wording may be polished. The framing statement and the credit must keep their meaning.

### Welcome (opens on every load and from the About button)

**How Network Automation Works**

Follow one ACME service through **Provision → Detect → Remediate**, and see how separate automation responsibilities hand work to each other.

For network engineers, architects and technical leaders who know networking. Based on the Network Automation Forum (NAF) framework.

- **→ / ←** step through the story
- **Simple / Technical** choose the depth
- **click / Enter** inspect anything on the canvas

Footer: **Notes and credits →** on the left; "Press Esc to begin" on the right.

### Notes and credits (one click from the welcome; ← Back returns)

**An example, not a prescription.** This shows how good network automation can look with the NAF framework as the reference. It is not a prescription for how network automation should look.

**Liberties taken**, each with a one-sentence why:

- **Presentation holds more than NAF's Presentation layer.** ITSM is usually its own platform; Fault and Performance Management may or may not count. Each surface's inspector says which. *Why:* one band keeps every place people see the story on one canvas, without extra regions that teach nothing new about the handoffs.
- **Collector enriches observations.** It tags them with link, path and service from a cached copy of intent. NAF places enrichment with intended-state context in Observability. *Why:* the signal stream is a first-class part of the system. Several consumers may use a signal as it arrives, without storing it, so it is tagged once, at the source, with authoritative IDs such as the service ID.

The inspector repeats each liberty where it applies: every surface has an "In NAF terms" line, and so does Collector.

**Credits**

- Made by Brian Strube Jeggesen. [Source on GitHub](https://github.com/bcjdk/naf-explorer).
- [NAF Automation Framework](https://reference.networkautomation.forum/Framework/Framework/) by the Network Automation Forum, the reference this story is built on.
- With warm thanks to my good friend Thomas Kjær Aabo, whose [How the Internet Works](https://tkjaer.github.io/how-the-internet-works/) ([source](https://github.com/tkjaer/how-the-internet-works)) directly inspired this project: its explorable, step-by-step picture of a complex system and its switch between simple and technical explanations.

### Behaviour of the two views

- Switching views moves focus to the new view's heading; closing from the notes reopens on the welcome next time.
- Both views fit a 1440×900 window without scrolling.

## Credit notes

- No code, text or assets from *How the Internet Works* (AGPL v3) are used, so no licence obligations apply. The credit acknowledges the ideas: the explorable step-by-step picture and the simple/technical switch.
- NAF brand guidelines (block colours, layout): https://reference.networkautomation.forum/Framework/brand-guidelines/
