<script lang="ts">
  import { CHAPTERS, ENDING, SCOPE_NOTE, STEPS } from '../scenario/scenario.ts';
  import type { View } from '../scenario/types.ts';

  let {
    step,
    view,
    hint,
    onBack,
    onNext,
    onRestart,
  }: {
    step: number;
    view: View;
    hint: boolean;
    onBack: () => void;
    onNext: () => void;
    onRestart: () => void;
  } = $props();

  const s = $derived(STEPS[step]!);
  const atStart = $derived(step === 0);
  const atEnd = $derived(step === STEPS.length - 1);
</script>

{#snippet tri(left: boolean)}
  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"
    ><path d={left ? 'M9 0v10L1 5z' : 'M1 0v10l8-5z'} /></svg
  >
{/snippet}

<footer class="caption">
  <h2 id="caption-heading" tabindex="-1">
    {CHAPTERS[s.chapter]} · <span data-testid="counter">{step + 1} / {STEPS.length}</span> · {s.title}
  </h2>
  <p class="text">{s.caption[view]}</p>
  <!-- One announcement per beat: where we are, then what happens (and, last, that the story is complete). -->
  <p class="sr-only" aria-live="polite">
    {CHAPTERS[s.chapter]}, step {step + 1} of {STEPS.length}: {s.title}. {s.caption[view]}{atEnd
      ? ` ${ENDING}`
      : ''}
  </p>
  <!-- One slot at the top right: the hint until the first inspection, then the legend; the ending on the last beat. -->
  {#if atEnd}
    <p class="ending">{ENDING}</p>
  {:else if hint}
    <p class="hint">Click any card, surface, line label or responsibility name to inspect it.</p>
  {:else}
    <p class="legend">
      <span
        ><svg width="28" height="8" aria-hidden="true"><line x1="0" y1="4" x2="28" y2="4" /></svg
        >artifact handoff</span
      >
      <span
        ><svg width="28" height="8" aria-hidden="true"
          ><line class="signal" x1="0" y1="4" x2="28" y2="4" /></svg
        >coordination signal</span
      >
      <span
        ><svg width="28" height="8" aria-hidden="true"
          ><line class="work" x1="0" y1="4" x2="28" y2="4" /></svg
        >work inside a responsibility</span
      >
    </p>
  {/if}
  {#if view === 'technical'}
    <p class="scope">{SCOPE_NOTE}</p>
  {/if}
  <!-- aria-disabled, not disabled: a disabled button drops keyboard focus to <body>. One forward button, so focus
       stays on it when it turns into Start over and back. -->
  <div class="nav">
    <button aria-disabled={atStart} onclick={() => !atStart && onBack()}
      >{@render tri(true)} Back</button
    >
    <button class="primary" onclick={() => (atEnd ? onRestart() : onNext())}
      >{#if atEnd}Start over{:else}Next {@render tri(false)}{/if}</button
    >
  </div>
</footer>
