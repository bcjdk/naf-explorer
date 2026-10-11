<script lang="ts">
  import { smoothPath, type Route } from '../routes.ts';
  import { STAGE } from '../layout.ts';

  let { routes, step }: { routes: Route[]; step: number } = $props();

  const drawn = $derived(routes.filter((r) => r.kind !== 'work'));
  const work = $derived(routes.filter((r) => r.kind === 'work'));
  /** Lines appear one after another in causal order; reduced motion shows them at once (app.css). */
  const delay = (i: number) => `${i * 0.42}s`;
</script>

<!-- The current beat's lines (spec §9). Labels are HTML so they can take focus; the SVG is decoration.
     Keyed by step so each beat's lines draw in afresh. -->
{#key step}
  <svg class="lines under" width={STAGE.w} height={STAGE.h} aria-hidden="true">
    {#each work as r, i (r.key)}
      <path class="route work" d={smoothPath(r.points)} style:animation-delay={delay(i)} />
    {/each}
  </svg>
  <svg class="lines" width={STAGE.w} height={STAGE.h} aria-hidden="true">
    <defs>
      <marker
        id="arrow"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="8"
        markerHeight="8"
        orient="auto-start-reverse"
      >
        <path d="M0,0 L10,5 L0,10 z" fill="var(--line)" />
      </marker>
    </defs>
    {#each drawn as r, i (r.key)}
      <path
        class="route {r.kind}"
        d={smoothPath(r.points)}
        marker-end="url(#arrow)"
        style:animation-delay={delay(i)}
      />
    {/each}
  </svg>
  {#each drawn as r, i (r.key)}
    <span
      class="pulse"
      aria-hidden="true"
      style:offset-path="path('{smoothPath(r.points)}')"
      style:animation-delay={delay(i)}
    ></span>
    <!-- Work lines are labelled by the region's work label (● …), not by a button of their own. -->
    <button
      class="label {r.kind}"
      class:lane={r.lane !== undefined}
      style:max-width={r.lane ? `${r.lane}px` : null}
      data-route={r.key}
      aria-label={r.spoken}
      style:left="{r.at[0]}px"
      style:top="{r.at[1]}px"
      style:animation-delay={delay(i)}>{r.label}</button
    >
  {/each}
{/key}
