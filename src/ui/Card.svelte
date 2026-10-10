<script lang="ts">
  import { kind, version } from '../scenario/scenario.ts';
  import type { View } from '../scenario/types.ts';
  import type { Slot, StageState } from '../model/state.ts';
  import { MARKER_TEXT, statusText } from '../model/describe.ts';

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
  const earlierText = (e: (typeof earlier)[number]) =>
    [e.label, e.status && statusText(e.status), marker(e.id) && MARKER_TEXT[marker(e.id)!]]
      .filter(Boolean)
      .join(' ');
</script>

<!-- A plain element until plan 4's inspector gives cards something to do. -->
<div class="card" class:new={isNew} data-version={v.id}>
  <div class="head">
    <span class="type">{kind(v.kind).name} · {v.label}</span>
    {#if v.status}<span class="chip">{statusText(v.status)}</span>{/if}
    {#if marker(v.id)}<span class="marker">{MARKER_TEXT[marker(v.id)!]}</span>{/if}
    {#if earlier.length}
      <span class="earlier"
        >earlier:
        {#each earlier as e (e.id)}
          <span data-version={e.id}>{earlierText(e)}</span>
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
