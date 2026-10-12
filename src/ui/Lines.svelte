<script lang="ts">
  import { smoothPath, type Route } from '../routes.ts';
  import { STAGE } from '../layout.ts';
  import type { Target } from '../model/inspect.ts';
  import { finishAll } from './motion.ts';
  import { RESPONSIBILITIES } from '../scenario/scenario.ts';
  import type { Party } from '../scenario/types.ts';

  let {
    routes,
    step,
    selected,
    onSelect,
  }: {
    routes: Route[];
    step: number;
    selected: Target | null;
    onSelect: (t: Target) => void;
  } = $props();
  const isSelected = (key: string) =>
    selected?.t === 'line' && selected.step === step && selected.key === key;

  // One marker per colour: `context-stroke` is not honoured everywhere and falls back to black.
  const colours = [...(Object.keys(RESPONSIBILITIES) as Party[]), 'line'];

  const drawn = $derived(routes.filter((r) => r.kind !== 'work'));
  const work = $derived(routes.filter((r) => r.kind === 'work'));
</script>

<!-- The current beat's lines (spec §9). Labels are HTML buttons: focusable and inspectable; the SVG is decoration.
     Lines are part of the beat's end state; `ui/motion.ts` animates them in (spec §8). Keyed by step. -->
{#key step}
  <svg class="lines under" width={STAGE.w} height={STAGE.h} aria-hidden="true">
    <defs>
      {#each colours as c (c)}
        <marker
          id="arrow-{c}"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" style:fill="var(--{c})" />
        </marker>
        <marker
          id="arrow-minor-{c}"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" style:fill="var(--{c})" />
        </marker>
      {/each}
    </defs>
    {#each work as r (r.key)}
      <path
        class="route work"
        d={smoothPath(r.points)}
        data-party={r.ends[0]}
        style:--accent="var(--{r.ends[0]})"
        marker-end="url(#arrow-minor-{r.ends[0]})"
      />
    {/each}
  </svg>
  <svg class="lines" width={STAGE.w} height={STAGE.h} aria-hidden="true">
    {#each drawn as r (r.key)}
      <path
        class="route {r.kind}"
        d={smoothPath(r.points)}
        marker-end="url(#arrow-{r.kind === 'handoff' ? r.ends[0] : 'line'})"
        data-route={r.key}
        style:--accent={r.kind === 'handoff' ? `var(--${r.ends[0]})` : null}
      />
    {/each}
  </svg>
  {#each drawn as r (r.key)}
    <span
      class="pulse"
      aria-hidden="true"
      data-route={r.key}
      style:offset-path="path('{smoothPath(r.points)}')"
    ></span>
    <!-- Work lines are labelled by the region's work pill, not by a button of their own. -->
    <button
      class="label {r.kind}"
      class:lane={r.lane !== undefined}
      style:max-width={r.lane ? `${r.lane}px` : null}
      class:selected={isSelected(r.key)}
      aria-current={isSelected(r.key) ? 'true' : undefined}
      onclick={() => onSelect({ t: 'line', step, key: r.key })}
      onfocus={finishAll}
      data-route={r.key}
      aria-label={r.spoken}
      style:left="{r.at[0]}px"
      style:--accent={r.kind === 'handoff' ? `var(--${r.ends[0]})` : null}
      style:top="{r.at[1]}px"
      >{#if r.kind === 'handoff'}<span class="swatch" aria-hidden="true"
        ></span>{/if}{r.label}</button
    >
  {/each}
{/key}
