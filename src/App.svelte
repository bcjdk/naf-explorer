<script lang="ts">
  import { STEPS } from './scenario/scenario.ts';
  import type { View } from './scenario/types.ts';
  import { linesOf, stateAt } from './model/state.ts';
  import { fitScale, STAGE } from './layout.ts';
  import { load, save } from './storage.ts';
  import Header from './ui/Header.svelte';
  import Stage from './ui/Stage.svelte';
  import CaptionBar from './ui/CaptionBar.svelte';

  const VIEW_KEY = 'naf.view';

  let step = $state(0);
  let view = $state<View>(load(VIEW_KEY) === 'technical' ? 'technical' : 'simple');
  let innerWidth = $state(1440);
  let innerHeight = $state(900);
  const scale = $derived(fitScale(innerWidth, innerHeight));
  const stage = $derived(stateAt(step));
  const lines = $derived(linesOf(step));

  function go(n: number) {
    step = Math.max(0, Math.min(STEPS.length - 1, n));
  }

  function setView(v: View) {
    view = v;
    save(VIEW_KEY, v);
  }

  function onKeydown(e: KeyboardEvent) {
    // Modified arrows belong to the browser and OS (history, text selection, spaces).
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(step + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(step - 1);
    }
  }
</script>

<svelte:window bind:innerWidth bind:innerHeight onkeydown={onKeydown} />

<div class="viewport">
  <div
    class="stage"
    style:width="{STAGE.w}px"
    style:height="{STAGE.h}px"
    style:transform="translate(-50%, -50%) scale({scale})"
  >
    <Header {step} {view} onJump={go} onView={setView} />
    <Stage {stage} {lines} {view} />
    <CaptionBar {step} {view} onBack={() => go(step - 1)} onNext={() => go(step + 1)} />
  </div>
</div>
