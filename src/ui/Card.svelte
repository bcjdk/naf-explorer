<script lang="ts">
  import { kind, version } from '../scenario/scenario.ts';
  import type { View } from '../scenario/types.ts';
  import type { Slot, StageState } from '../model/state.ts';
  import { MARKER_TEXT, STATUS_ICON } from '../model/describe.ts';

  let {
    slot,
    stage,
    view,
    compact = false,
  }: { slot: Slot; stage: StageState; view: View; compact?: boolean } = $props();

  const v = $derived(version(slot.versions.at(-1)!));
  const earlier = $derived(slot.versions.slice(0, -1).map(version));
  const isNew = $derived(stage.newIds.includes(v.id));
  const marker = (id: string) => stage.markers[id];
</script>

<!-- A plain element until plan 4's inspector gives cards something to do. -->
<div class="card" class:new={isNew} data-version={v.id}>
  <div class="head">
    <span class="type">{kind(v.kind).name} · {v.label}</span>
    {#if v.status}<span class="chip">{STATUS_ICON[v.status]} {v.status}</span>{/if}
    {#if marker(v.id)}<span class="marker">{MARKER_TEXT[marker(v.id)!]}</span>{/if}
    {#if earlier.length}
      <span class="earlier"
        >earlier:
        {#each earlier as e (e.id)}
          <span data-version={e.id}
            >{e.label}{#if e.status}
              {STATUS_ICON[e.status]} {e.status}{/if}{#if marker(e.id)}
              {MARKER_TEXT[marker(e.id)!]}{/if}</span
          >
        {/each}
      </span>
    {/if}
  </div>
  {#if isNew && !compact}
    {#if view === 'simple'}
      <p class="body">{v.meaning}</p>
    {:else}
      {#each v.technical as line, i (i)}<code class="line">{line}</code>{/each}
    {/if}
  {/if}
</div>
