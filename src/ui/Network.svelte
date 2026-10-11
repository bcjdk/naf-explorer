<script lang="ts">
  import { NETWORK, RESPONSIBILITIES } from '../scenario/scenario.ts';
  import type { View } from '../scenario/types.ts';
  import type { StageState } from '../model/state.ts';
  import { statusText } from '../model/describe.ts';
  import { DIAMOND, FACTS, REGIONS, SLOTS } from '../layout.ts';
  import Card from './Card.svelte';

  let { stage, view, work }: { stage: StageState; view: View; work: string } = $props();

  // Topology inside DIAMOND (relative to the region): a stretched diamond (spec §3).
  const N = {
    CPH01: [DIAMOND.x + 30, DIAMOND.y + 40],
    ODE01: [DIAMOND.x + DIAMOND.w / 2, DIAMOND.y + 12],
    KOL01: [DIAMOND.x + DIAMOND.w / 2, DIAMOND.y + 68],
    AAR01: [DIAMOND.x + DIAMOND.w - 30, DIAMOND.y + 40],
  } as const;
  type Node = keyof typeof N;
  const pathA: [Node, Node][] = [
    ['CPH01', 'ODE01'],
    ['ODE01', 'AAR01'],
  ];
  const pathB: [Node, Node][] = [
    ['CPH01', 'KOL01'],
    ['KOL01', 'AAR01'],
  ];
  const acme = $derived(stage.acmePath === 'A' ? pathA : stage.acmePath === 'B' ? pathB : []);
  const isAcme = (a: Node, b: Node) => acme.some(([x, y]) => x === a && y === b);
  const via = $derived(stage.acmePath === 'B' ? 'KOL01' : 'ODE01');
</script>

<section
  class="region network"
  class:active={work !== ''}
  data-party="network"
  data-link={stage.linkDegraded ? 'DEGRADED' : 'OK'}
  data-path={stage.acmePath ?? 'none'}
  aria-labelledby="h-network"
  style="left:{REGIONS.network.x}px;top:{REGIONS.network.y}px;width:{REGIONS.network
    .w}px;height:{REGIONS.network.h}px;--accent:var(--network)"
>
  {#each stage.slots.network ?? [] as slot (slot.kind)}
    <Card {slot} {stage} {view} rect={SLOTS[slot.kind]!} />
  {/each}

  <svg
    class="topology"
    width={REGIONS.network.w - 4}
    height={REGIONS.network.h - 4}
    aria-hidden="true"
  >
    <defs>
      <pattern
        id="hatch"
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="3" height="6" fill="var(--hatch-a)" />
      </pattern>
      <marker
        id="towards"
        viewBox="0 0 8 8"
        refX="6"
        refY="4"
        markerWidth="7"
        markerHeight="7"
        orient="auto"
      >
        <path d="M0,0 L8,4 L0,8 z" fill="var(--hatch-a)" />
      </marker>
    </defs>
    {#each [...pathA, ...pathB] as [a, b] (a + b)}
      <line
        x1={N[a][0]}
        y1={N[a][1]}
        x2={N[b][0]}
        y2={N[b][1]}
        class="link"
        class:acme={isAcme(a, b)}
      />
    {/each}
    {#if stage.linkDegraded}
      <!-- ODE01→CPH01 strand: hatched, with the direction of the failing light. -->
      <line x1={N.ODE01[0]} y1={N.ODE01[1]} x2={N.CPH01[0]} y2={N.CPH01[1]} class="degraded" />
      <line
        x1={(N.ODE01[0] + N.CPH01[0]) / 2 + 20}
        y1={(N.ODE01[1] + N.CPH01[1]) / 2 - 3}
        x2={(N.ODE01[0] + N.CPH01[0]) / 2 - 20}
        y2={(N.ODE01[1] + N.CPH01[1]) / 2 + 3}
        class="direction"
        marker-end="url(#towards)"
      />
    {/if}
    {#if view === 'technical' && stage.acmePath}
      <polyline
        class="probe"
        points="{N.CPH01[0]},{N.CPH01[1] + 6} {N[via][0]},{N[via][1] + 6} {N.AAR01[0]},{N.AAR01[1] +
          6}"
      />
    {/if}
    {#each Object.entries(N) as [name, [x, y]] (name)}
      <rect x={x - 28} y={y - 9} width="56" height="18" rx="3" class="node" />
      <text {x} y={y + 4} class="node-name">{name}</text>
    {/each}
  </svg>

  <h2 id="h-network"><span class="swatch"></span>{RESPONSIBILITIES.network.name}</h2>
  <!-- The role sits at the top right, leaving the band's top left free for line labels. -->
  <p class="net-role">{RESPONSIBILITIES.network.role}</p>
  <div class="facts" style:left="{FACTS.x}px" style:top="{FACTS.y}px" style:width="{FACTS.w}px">
    <p data-fact="link">
      {NETWORK.link}:
      {#if stage.linkDegraded}
        <span class="chip degraded">{statusText('DEGRADED')}</span> {NETWORK.linkDegraded[view]}
      {:else}
        {NETWORK.linkOk[view]}
      {/if}
    </p>
    <p data-fact="path">{NETWORK.acme[stage.acmePath ?? 'none'][view]}</p>
    <p>{NETWORK.device[view]}</p>
  </div>
</section>
