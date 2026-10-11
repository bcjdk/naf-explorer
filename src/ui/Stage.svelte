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
  import { statusText } from '../model/describe.ts';
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
  }: { stage: StageState; routes: Route[]; view: View; step: number } = $props();

  const automation: Party[] = ['observability', 'orchestrator', 'intent', 'collector', 'executor'];
  const surfaces = Object.keys(SURFACES) as Surface[];
  const box = (r: Rect) => `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;
  const work = (p: Party) => (stage.work[p] ?? []).map((l) => l[view]).join(' · ');
  const ownRequest = (s: Surface) =>
    (stage.slots.presentation ?? []).filter((slot) => kind(slot.kind).producerSurface === s);
</script>

{#snippet header(p: Party)}
  <h2 id="h-{p}">
    <span class="swatch"></span>{RESPONSIBILITIES[p].name}
    {#if work(p)}<span class="work">● {work(p)}</span>{:else}<span class="role"
        >· {RESPONSIBILITIES[p].role}</span
      >{/if}
  </h2>
{/snippet}

<section
  class="region"
  class:active={work('presentation') !== ''}
  data-party="presentation"
  aria-labelledby="h-presentation"
  style="{box(REGIONS.presentation)};--accent:var(--presentation)"
>
  {@render header('presentation')}
  {#each surfaces as s (s)}
    {@const received = stage.surfaces[s] ? version(stage.surfaces[s]!) : undefined}
    <div
      class="surface"
      data-surface={s}
      data-received={stage.surfaces[s] ?? ''}
      style={box(SURFACE_RECTS[s])}
    >
      <span class="surface-name">{SURFACES[s]} <span class="role">· {SURFACE_ROLES[s]}</span></span>
      <div class="minis">
        {#each ownRequest(s) as slot (slot.kind)}
          {@const own = version(slot.versions.at(-1)!)}
          <div class="mini own" class:new={stage.newIds.includes(own.id)} data-version={own.id}>
            <span class="type">{kind(own.kind).name}</span>
          </div>
        {/each}
        {#if received}
          <div class="mini" style:--accent="var(--{kind(received.kind).producer})">
            <span class="type">{kind(received.kind).name}</span>
            {#if received.status}<span class="chip {received.status.toLowerCase()}"
                >{statusText(received.status)}</span
              >{/if}
          </div>
        {/if}
      </div>
    </div>
  {/each}
</section>

{#each automation as p (p)}
  <section
    class="region"
    class:active={work(p) !== ''}
    data-party={p}
    aria-labelledby="h-{p}"
    style="{box(REGIONS[p])};--accent:var(--{p})"
  >
    {@render header(p)}
    {#each stage.slots[p] ?? [] as slot (slot.kind)}
      <Card {slot} {stage} {view} rect={SLOTS[slot.kind]!} />
    {/each}
  </section>
{/each}

<Network {stage} {view} work={work('network')} />

<Lines {routes} {step} />
