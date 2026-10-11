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
  import { MARKER_TEXT, statusText } from '../model/describe.ts';
  import type { Rect } from '../layout.ts';

  let { slot, stage, view, rect }: { slot: Slot; stage: StageState; view: View; rect: Rect } =
    $props();

  const v = $derived(version(slot.versions.at(-1)!));
  const k = $derived(kind(v.kind));
  const earlier = $derived(slot.versions.slice(0, -1).map(version));
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

<!-- Earlier versions sit stacked behind (box-shadow layers); their text stays in the DOM for screen readers. -->
<div
  class="card stack-{Math.min(earlier.length, 2)}"
  class:new={isNew}
  class:touched={!isNew && (stage.touched.includes(v.id) || running)}
  data-version={v.id}
  style:--accent="var(--{k.producer})"
  style:left="{rect.x}px"
  style:top="{rect.y}px"
  style:width="{rect.w - 6}px"
  style:height="{rect.h - 6}px"
>
  <div class="head">
    <span class="by">by {RESPONSIBILITIES[k.producer].name}</span>
    <span class="type">{k.name} · {v.label}</span>
    {#if v.status}<span class="chip {v.status.toLowerCase()}">{statusText(v.status)}</span>{/if}
    {#if marker(v.id)}<span class="marker">{MARKER_TEXT[marker(v.id)!]}</span>{/if}
  </div>
  <div class="body">
    {#if view === 'simple'}
      {v.meaning}
    {:else}
      {#each v.technical as line, i (i)}<code class="line">{line}</code>{/each}
    {/if}
  </div>
  {#if steps}
    <ol class="wf-steps" aria-label="Workflow steps">
      {#each steps as st, i (st.label)}
        <li class:done={i < now} class:now={i === now}>{st.label}</li>
      {/each}
    </ol>
    {#if running && stage.waiting}
      <p class="waiting">
        waiting for {RESPONSIBILITIES[stage.waiting.from].name}: {answerName(stage.waiting.answer)}
      </p>
    {/if}
  {/if}
  {#each earlier as e (e.id)}
    <span class="sr-only" data-version={e.id}>earlier version: {earlierText(e)}</span>
  {/each}
</div>
