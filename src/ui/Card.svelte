<script lang="ts">
  import {
    RESPONSIBILITIES,
    SIGNALS,
    WORKFLOW_STEPS,
    kind,
    version,
  } from '../scenario/scenario.ts';
  import type { KindId, SignalId } from '../scenario/types.ts';
  import type { View } from '../scenario/types.ts';
  import type { Slot, StageState } from '../model/state.ts';
  import { MARKER_TEXT, cardName, statusText } from '../model/describe.ts';
  import type { Target } from '../model/inspect.ts';
  import type { Rect } from '../layout.ts';

  let {
    slot,
    stage,
    view,
    rect,
    selected,
    onSelect,
  }: {
    slot: Slot;
    stage: StageState;
    view: View;
    rect: Rect;
    selected: Target | null;
    onSelect: (t: Target) => void;
  } = $props();

  const v = $derived(version(slot.versions.at(-1)!));
  const k = $derived(kind(v.kind));
  const earlier = $derived(slot.versions.slice(0, -1).map(version));
  // Any version in the slot rings the slot's card.
  const isSelected = $derived(
    selected?.t === 'artifact' && slot.versions.includes(selected.version),
  );
  const isNew = $derived(stage.newIds.includes(v.id));
  // A workflow record shows its steps; the running one stands forward and says what it waits for.
  const steps = $derived(WORKFLOW_STEPS[v.id]);
  const now = $derived(stage.progress[v.id] ?? -1);
  const running = $derived(steps !== undefined && now < steps.length);
  const answerName = (a: string) =>
    a in SIGNALS ? SIGNALS[a as SignalId].label : kind(a as KindId).name;
  const marker = (id: string) => stage.markers[id];
  const earlierText = (e: (typeof earlier)[number]) =>
    [e.label, e.status && statusText(e.status), marker(e.id) && MARKER_TEXT[marker(e.id)!]]
      .filter(Boolean)
      .join(' ');
</script>

<!-- Earlier versions sit stacked behind (box-shadow layers); their text stays in the DOM for the e2e end-state check; the button's name carries how many. -->
<button
  type="button"
  class="card stack-{Math.min(earlier.length, 2)}"
  class:selected={isSelected}
  aria-current={isSelected ? 'true' : undefined}
  aria-label={cardName(v.id, marker(v.id), earlier.length)}
  onclick={() => onSelect({ t: 'artifact', version: v.id })}
  class:new={isNew}
  class:touched={!isNew && (stage.touched.includes(v.id) || running)}
  data-version={v.id}
  data-producer={k.producer}
  style:--accent="var(--{k.producer})"
  style:left="{rect.x}px"
  style:top="{rect.y}px"
  style:width="{rect.w - 6}px"
  style:height="{rect.h - 6}px"
>
  <!-- The header is the producer's band when the card is new; status never sits on a provenance colour (plan 5 D6). -->
  <span class="head">
    <span class="by">by {RESPONSIBILITIES[k.producer].name}</span>
    <span class="type">{k.name} · {v.label}</span>
  </span>
  {#if v.status || marker(v.id)}
    <span class="status">
      {#if v.status}<span class="chip {v.status.toLowerCase()}">{statusText(v.status)}</span>{/if}
      {#if marker(v.id)}<span class="marker">{MARKER_TEXT[marker(v.id)!]}</span>{/if}
    </span>
  {/if}
  <span class="body">
    {#if view === 'simple'}
      {v.meaning}
    {:else}
      {#each v.technical as line, i (i)}<code class="line">{line}</code>{/each}
    {/if}
  </span>
  {#if steps}
    <span class="wf-steps">
      {#each steps as st, i (st.label)}
        <span class="wf-step" class:done={i < now} class:now={i === now}>{st.label}</span>
      {/each}
    </span>
    {#if running && stage.waiting}
      <span class="waiting">
        waiting for {RESPONSIBILITIES[stage.waiting.from].name}: {answerName(stage.waiting.answer)}
      </span>
    {/if}
  {/if}
  {#each earlier as e (e.id)}
    <span class="sr-only" data-version={e.id}>earlier version: {earlierText(e)}</span>
  {/each}
</button>
