# About window and credits (decided)

## Behaviour

- **One window, two ways to open it:** it opens automatically on a visitor's **first visit** (remembered per browser), and from an **About** button next to the Simple/Technical switch.
- **Closing:** a **✕ in the top-right corner**, **Esc**, or a click outside. There is **no Start button**.
- **It is a modal dialog:**
  - focus moves to ✕ when it opens and returns to where it was when it closes;
  - the story does not move while it is open;
  - links open in a new tab.

## Content

Wording may be polished. The framing statement and the credit must keep their meaning.

**How Network Automation Works**

An interactive explainer of network automation as separate responsibilities connected by typed handoffs, based on the Network Automation Forum (NAF) framework. It follows one ACME L3VPN service through **Provision → Detect → Remediate**.

**Who it is for**
Network engineers, architects and senior technical leadership who know networking and want a clear mental model of how automation systems divide the work.

**Why**
Automation is easier to reason about as roles and handoffs than as a list of tools — and "the interface is UP" is not the same as "the service is healthy".

> This is an example of how good network automation can look when the NAF framework is used as the reference — not a prescription for how network automation should look.

**How to use it**
→ / ← to step through · **Simple** / **Technical** for depth · click anything to inspect it.

**References**

- [NAF Automation Framework](https://reference.networkautomation.forum/Framework/Framework/) — the Network Automation Forum reference architecture this story is built on.
- With warm thanks to my good friend Thomas Kjær Aabo, whose [How the Internet Works](https://tkjaer.github.io/how-the-internet-works/) ([source](https://github.com/tkjaer/how-the-internet-works)) directly inspired this project — its explorable, step-by-step picture of a complex system and its switch between simple and technical explanations shaped the approach here.

## Credit notes

- No code, text or assets from *How the Internet Works* (AGPL v3) are used, so no licence obligations apply. The credit acknowledges the ideas: the explorable step-by-step picture and the simple/technical switch.
- NAF brand guidelines (block colours, layout): https://reference.networkautomation.forum/Framework/brand-guidelines/
