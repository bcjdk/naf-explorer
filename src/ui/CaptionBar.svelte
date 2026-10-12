<script lang="ts">
  import { CHAPTERS, SCOPE_NOTE, STEPS } from '../scenario/scenario.ts';
  import type { View } from '../scenario/types.ts';

  let {
    step,
    view,
    hint,
    onBack,
    onNext,
  }: { step: number; view: View; hint: boolean; onBack: () => void; onNext: () => void } = $props();

  const s = $derived(STEPS[step]!);
  const atStart = $derived(step === 0);
  const atEnd = $derived(step === STEPS.length - 1);
</script>

<footer class="caption">
  <h2 id="caption-heading" tabindex="-1">
    {CHAPTERS[s.chapter]} · <span data-testid="counter">{step + 1} / {STEPS.length}</span> · {s.title}
  </h2>
  <p aria-live="polite">{s.caption[view]}</p>
  {#if hint}
    <p class="hint">Click any card, line label or responsibility name to inspect it.</p>
  {/if}
  {#if view === 'technical'}
    <p class="scope">{SCOPE_NOTE}</p>
  {/if}
  <!-- aria-disabled, not disabled: a disabled button drops keyboard focus to <body>. -->
  <div class="nav">
    <button aria-disabled={atStart} onclick={() => !atStart && onBack()}>◄ Back</button>
    <button aria-disabled={atEnd} onclick={() => !atEnd && onNext()}>Next ►</button>
  </div>
</footer>
