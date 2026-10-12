<script lang="ts">
  import {
    RESPONSIBILITIES,
    SURFACES,
    SURFACE_ROLES,
    kind,
    version,
  } from '../scenario/scenario.ts';
  import type { Party, Surface, View } from '../scenario/types.ts';
  import type { StageState } from '../model/state.ts';
  import { surfaceName, statusText } from '../model/describe.ts';
  import type { Target } from '../model/inspect.ts';
  import type { Route } from '../routes.ts';
  import { REGIONS, SLOTS, SURFACE_RECTS, type Rect } from '../layout.ts';
  import Card from './Card.svelte';
  import Network from './Network.svelte';
  import Lines from './Lines.svelte';

  let {
    stage,
    routes,
    view,
    step,
    selected,
    onSelect,
  }: {
    stage: StageState;
    routes: Route[];
    view: View;
    step: number;
    selected: Target | null;
    onSelect: (t: Target) => void;
  } = $props();

  const automation: Party[] = ['observability', 'orchestrator', 'intent', 'collector', 'executor'];
  const surfaces = Object.keys(SURFACES) as Surface[];
  const box = (r: Rect) => `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;
  const work = (p: Party) => (stage.work[p] ?? []).map((l) => l[view]).join(' · ');
  const isParty = (p: Party) => selected?.t === 'responsibility' && selected.party === p;
  const isSurface = (s: Surface) =>
    (selected?.t === 'surface' && selected.surface === s) ||
    (selected?.t === 'artifact' && kind(version(selected.version).kind).producerSurface === s);
  const ownRequest = (s: Surface) =>
    (stage.slots.presentation ?? []).filter((slot) => kind(slot.kind).producerSurface === s);
</script>

{#snippet header(p: Party)}
  <h2 id="h-{p}">
    <button
      type="button"
      class="region-name"
      onclick={() => onSelect({ t: 'responsibility', party: p })}
      ><span class="swatch"></span>{RESPONSIBILITIES[p].name}</button
    >
    {#if work(p)}<span class="work">{work(p)}</span>{:else}<span class="role"
        >· {RESPONSIBILITIES[p].role}</span
      >{/if}
  </h2>
{/snippet}

<section
  class="region"
  class:active={work('presentation') !== ''}
  class:selected={isParty('presentation')}
  aria-current={isParty('presentation') ? 'true' : undefined}
  data-party="presentation"
  aria-labelledby="h-presentation"
  style="{box(REGIONS.presentation)};--accent:var(--presentation)"
>
  {@render header('presentation')}
  {#each surfaces as s (s)}
    {@const received = stage.surfaces[s] ? version(stage.surfaces[s]!) : undefined}
    <button
      type="button"
      class="surface"
      class:selected={isSurface(s)}
      aria-current={isSurface(s) ? 'true' : undefined}
      aria-label={surfaceName(s, stage.surfaces[s])}
      onclick={() => onSelect({ t: 'surface', surface: s })}
      data-surface={s}
      data-received={stage.surfaces[s] ?? ''}
      style={box(SURFACE_RECTS[s])}
    >
      <span class="surface-name">{SURFACES[s]} <span class="role">· {SURFACE_ROLES[s]}</span></span>
      <span class="minis">
        {#each ownRequest(s) as slot (slot.kind)}
          {@const own = version(slot.versions.at(-1)!)}
          <span class="mini own" class:new={stage.newIds.includes(own.id)} data-version={own.id}>
            <span class="type">{kind(own.kind).name}</span>
          </span>
        {/each}
        {#if received}
          <span class="mini" style:--accent="var(--{kind(received.kind).producer})">
            <span class="type">{kind(received.kind).name}</span>
            {#if received.status}<span class="chip {received.status.toLowerCase()}"
                >{statusText(received.status)}</span
              >{/if}
          </span>
        {/if}
      </span>
    </button>
  {/each}
</section>

{#each automation as p (p)}
  <section
    class="region"
    class:active={work(p) !== ''}
    class:selected={isParty(p)}
    aria-current={isParty(p) ? 'true' : undefined}
    data-party={p}
    aria-labelledby="h-{p}"
    style="{box(REGIONS[p])};--accent:var(--{p})"
  >
    {@render header(p)}
    <!-- Until its first card, a region introduces itself from the inspector's data (spec §3.3); no motion. -->
    {#if !(stage.slots[p] ?? []).length}
      <div class="intro">
        <p><span class="intro-label">Does</span> {RESPONSIBILITIES[p].does[0]}</p>
        <p><span class="intro-label">Does not</span> {RESPONSIBILITIES[p].doesNot[0]}</p>
      </div>
    {/if}
    {#each stage.slots[p] ?? [] as slot (slot.kind)}
      <Card {slot} {stage} {view} rect={SLOTS[slot.kind]!} {selected} {onSelect} />
    {/each}
  </section>
{/each}

<Network {stage} {view} work={work('network')} {selected} {onSelect} />

<Lines {routes} {step} {selected} {onSelect} />
