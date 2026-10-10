<script lang="ts">
  import { NETWORK, RESPONSIBILITIES, SURFACES, kind, version } from '../scenario/scenario.ts';
  import type { Party, Surface, View } from '../scenario/types.ts';
  import type { Line, StageState } from '../model/state.ts';
  import { STATUS_ICON, describe } from '../model/describe.ts';
  import { COLUMNS, EXCHANGES, REGIONS, type Rect } from '../layout.ts';
  import Card from './Card.svelte';

  let { stage, lines, view }: { stage: StageState; lines: Line[]; view: View } = $props();

  const automation: Party[] = ['observability', 'collector', 'orchestrator', 'intent', 'executor'];
  const surfaces = Object.keys(SURFACES) as Surface[];
  const box = (r: Rect) => `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;
  const subtitle = (p: Party) =>
    stage.work[p]
      ? `● ${stage.work[p]!.map((l) => l[view]).join(' · ')}`
      : RESPONSIBILITIES[p].role;
  const ownSlots = (s: Surface) =>
    (stage.slots.presentation ?? []).filter((slot) => kind(slot.kind).producerSurface === s);
</script>

<section
  class="region"
  data-party="presentation"
  aria-labelledby="h-presentation"
  style={box(REGIONS.presentation)}
>
  <h2 id="h-presentation">Presentation <span class="role">· {subtitle('presentation')}</span></h2>
  <div class="surfaces">
    {#each surfaces as s (s)}
      {@const received = stage.surfaces[s] ? version(stage.surfaces[s]!) : undefined}
      <div class="surface" data-surface={s} data-received={stage.surfaces[s] ?? ''}>
        <span class="type">{SURFACES[s]}</span>
        {#if received}
          <span class="received"
            >{kind(received.kind).name} · {received.label}
            {#if received.status}<span class="chip"
                >{STATUS_ICON[received.status]} {received.status}</span
              >{/if}</span
          >
        {:else if ownSlots(s).length === 0}
          <span class="idle">idle</span>
        {/if}
        {#each ownSlots(s) as slot (slot.kind)}
          <Card {slot} {stage} {view} compact />
        {/each}
      </div>
    {/each}
  </div>
</section>

{#each automation as p (p)}
  <section class="region" data-party={p} aria-labelledby="h-{p}" style={box(REGIONS[p])}>
    <h2 id="h-{p}">{RESPONSIBILITIES[p].name} <span class="role">· {subtitle(p)}</span></h2>
    <div class="cards" style:--cols={COLUMNS[p] ?? 1}>
      {#each stage.slots[p] ?? [] as slot (slot.kind)}
        <Card {slot} {stage} {view} />
      {/each}
    </div>
  </section>
{/each}

<section
  class="region network"
  data-party="network"
  data-link={stage.linkDegraded ? 'DEGRADED' : 'OK'}
  data-path={stage.acmePath ?? 'none'}
  aria-labelledby="h-network"
  style={box(REGIONS.network)}
>
  <h2 id="h-network">
    {RESPONSIBILITIES.network.name} <span class="role">· {subtitle('network')}</span>
  </h2>
  <p>
    {NETWORK.link}:
    {#if stage.linkDegraded}
      <span class="chip">{STATUS_ICON.DEGRADED} DEGRADED</span> {NETWORK.linkDegraded[view]}
    {:else}
      {NETWORK.linkOk[view]}
    {/if}
  </p>
  <p>{NETWORK.device[view]}</p>
  <p>{NETWORK.acme[stage.acmePath ?? 'none'][view]}</p>
  <div class="cards">
    {#each stage.slots.network ?? [] as slot (slot.kind)}
      <Card {slot} {stage} {view} />
    {/each}
  </div>
</section>

<section class="region exchanges" aria-labelledby="h-exchanges" style={box(EXCHANGES)}>
  <h2 id="h-exchanges">This step <span class="role">· in causal order</span></h2>
  {#if lines.length}
    <ol>
      {#each lines as e, i (i)}<li class={e.t}>{describe(e, view)}</li>{/each}
    </ol>
  {:else}
    <p class="idle">no exchanges</p>
  {/if}
</section>
